'use strict';

const Queue = require('./adapterQueue');

class DeviceContext {
    /**
     * @param {object} adapter
     * @param {string} deviceId
     * @param {object} vacbot
     * @param {object} vacuum
     * @param {object} [throttle] - Optional RequestThrottle instance for rate limiting
     * @param {boolean} [skipPrefix=false] - When true, adapterProxy does NOT prepend deviceId
     */
    constructor(adapter, deviceId, vacbot, vacuum, throttle = null, skipPrefix = false) {
        this.adapter = adapter;
        this.deviceId = deviceId;
        this.did = vacuum.did;
        this.vacbot = vacbot;
        this.vacuum = vacuum;

        this.model = null;
        this.device = null;

        this.commandQueue = new Queue(this, 'commandQueue', 500, true, throttle);
        this.intervalQueue = new Queue(this, 'intervalQueue', 1000, true, throttle);
        this.cleaningQueue = new Queue(this, 'cleaningQueue', 0, false);

        // In-memory caches for performance optimization
        // Avoids repeated ioBroker DB roundtrips for state reads and object existence checks
        this._stateValues = new Map();
        this._createdObjects = new Set();
        this._createdChannels = new Set();

        this.connected = false;
        this.connectionFailed = false;
        this.connectedTimestamp = 0;
        this.chargestatus = '';
        this.cleanstatus = '';
        this.waterLevel = null;
        this.moppingType = null;
        this.cleanSpeed = null;
        this.currentMapID = '';
        this.deebotPositionIsInvalid = true;
        this.currentCleanedArea = 0;
        this.currentCleanedSeconds = 0;
        this.currentSpotAreaID = 'unknown';
        this.currentSpotAreaName = 'unknown';
        this.currentSpotAreaData = {
            'spotAreaID': 'unknown',
            'lastTimeEnteredTimestamp': 0
        };
        this.cleaningClothReminder = {
            'enabled': false,
            'period': 30
        };
        this.cleanPreference = null;
        this.relocationState = 'unknown';
        this.goToPositionArea = null;
        this.deebotPosition = null;
        this.chargePosition = null;
        this.pauseBeforeDockingChargingStation = false;
        this.pauseBeforeDockingIfWaterboxInstalled = false;
        this.resetCleanSpeedToStandardOnReturn = false;
        this.waterboxInstalled = null;
        this.pauseWhenEnteringSpotArea = '';
        this.pauseWhenLeavingSpotArea = '';
        this.canvasModuleIsInstalled = adapter.canvasModuleIsInstalled;
        this.customAreaCleanings = 1;
        this.spotAreaCleanings = 1;
        this.cleaningLogAcknowledged = false;
        this.lastChargeStatus = '';
        this.errorCode = null;
        this.last20Errors = [];
        this.retries = 0;
        this.silentApproach = {};
        this.retrypauseTimeout = null;
        this.getStatesInterval = null;
        this.getGetPosInterval = null;
        this.airDryingActiveInterval = null;
        this.airDryingStartTimestamp = 0;
        this.unreachableWarningSent = false;
        this.unreachableRetryTimeout = null;
        this.unreachableRetryCount = 0;
        this._pendingErrorWriteTimeout = null;

        // Consecutive command failure tracking for detecting when a robot goes unreachable
        this.commandFailedCount = 0;
        this.commandFailedResetTimeout = null;

        // Store skipPrefix flag for statePath() usage
        this.skipPrefix = skipPrefix;

        // Device enabled/disabled flag - when false, device control and sync are deactivated
        this.enabled = true;

        // Proxy that auto-prefixes state IDs with deviceId (skipped when skipPrefix is true)
        const prefix = skipPrefix ? '' : (deviceId + '.');
        const prefixMethods = [
            'createObjectNotExists', 'setStateConditional', 'setStateConditionalAsync',
            'getStateAsync', 'objectExists', 'deleteObjectIfExists',
            'createChannelNotExists', 'setObjectNotExistsAsync', 'getObjectAsync',
            'extendObjectAsync', 'deleteChannelIfExists', 'getChannelsOfAsync'
        ];
        this.adapterProxy = new Proxy(adapter, {
            get: (target, prop) => {
                if (prefixMethods.includes(prop) && typeof target[prop] === 'function') {
                    return function(...args) {
                        if (typeof args[0] === 'string' && !args[0].startsWith(prefix)) {
                            args[0] = prefix + args[0];
                        }
                        return target[prop].apply(target, args);
                    };
                }
                return target[prop];
            }
        });
    }

    statePath(path) {
        if (this.skipPrefix) {
            return path;
        }
        return this.deviceId + '.' + path;
    }

    getModel() {
        return this.model;
    }

    getDevice() {
        return this.device;
    }

    getModelType() {
        return this.model ? this.model.getModelType() : '';
    }
}

module.exports = DeviceContext;