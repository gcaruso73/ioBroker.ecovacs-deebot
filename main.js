'use strict';

const utils = require('@iobroker/adapter-core');
const ecovacsDeebot = require('ecovacs-deebot');
const nodeMachineId = require('node-machine-id');
const adapterObjects = require('./lib/adapterObjects');
const adapterCommands = require('./lib/adapterCommands');
const C = require('./lib/constants');
const helper = require('./lib/adapterHelper');
const Model = require('./lib/deebotModel');
const Device = require('./lib/device');
const DeviceContext = require('./lib/deviceContext');
const RequestThrottle = require('./lib/requestThrottle');
const EcoVacsAPI = ecovacsDeebot.EcoVacsAPI;
const mapObjects = require('./lib/mapObjects');
const eventHandlers = require('./lib/eventHandlers');
const mapHelper = require('./lib/mapHelper');

class EcovacsDeebot extends utils.Adapter {
    constructor(options) {
        super(
            Object.assign(
                options || {}, {
                    name: 'ecovacs-deebot'
                }
            )
        );
        this._deviceConnectionTimeout = null;

        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
        this.on('message', this.onMessage.bind(this));

        this.deviceContexts = new Map();
        this.canvasModuleIsInstalled = EcoVacsAPI.isCanvasModuleAvailable();
        this.pollingInterval = 120000;
        this.autoUpdateInterval = 30000; // Debounced auto-update: max 30s between polls, reset on any event
        this.password = '';
        this.authFailed = false;

        // Global request throttle: max 10 requests per 30 seconds across all devices
        this.requestThrottle = new RequestThrottle({
            maxRequests: 10,
            windowMs: 30000
        });

        // Global MQTT unreachable state - when set, ALL device requests are paused
        // This prevents a flood of identical "MQTT server is offline" warnings
        // from multiple devices when the MQTT server goes down
        this.globalMqttUnreachable = false;
        this.globalMqttUnreachableTimeout = null;
        this.globalMqttUnreachableCount = 0;
        this.globalMqttOfflineWarningSent = false;
        this.lastMqttOfflineLogTimestamp = 0;
        this._lastConnectTime = 0;
        this._startupTime = 0;
    }

    async onReady() {
        this._startupTime = Date.now();
        this.log.info(`EcovacsDeebot onReady: namespace=${this.namespace}, adapter is alive and listening`);
        // Migrate legacy native key that collides with dot-notation unflattening
        await this.migrateNativeConfig();

        // Assign logger to the throttle now that adapter is ready
        this.requestThrottle.log = this.log;

        // Reset the connection indicator during startup
        this.setStateConditional('info.connection', false, true);
        this.setStateConditional('info.deviceCount', 0, true);
        this.setStateConditional('info.deviceDiscovery', '', true);

        // Password is auto-decrypted by js-controller via encryptedNative
        this.password = this.config.password;
        if (this.password) {
            this.connect();
        } else {
            this.log.error('No password configured. Please check adapter config.');
        }
        this.subscribeStates('*');

        // Self-test: verify sendTo message routing works
        this.log.info(`Self-test: sending sendTo to ${this.namespace} with command getDeviceList`);
        this.sendTo(this.namespace, 'getDeviceList', {}, (result) => {
            this.log.info(`Self-test sendTo response received: ${JSON.stringify(result)}`);
        });
    }

    onUnload(callback) {
        try {
            for (const ctx of this.deviceContexts.values()) {
                if (ctx.vacbot) {
                    ctx.vacbot.disconnect();
                    if (typeof ctx.vacbot.removeAllListeners === 'function') {
                        ctx.vacbot.removeAllListeners();
                    }
                }
                this.stopPolling(ctx);
                if (ctx.getGetPosInterval) {
                    clearInterval(ctx.getGetPosInterval);
                }
                if (ctx.airDryingActiveInterval) {
                    clearInterval(ctx.airDryingActiveInterval);
                }
                if (ctx.retrypauseTimeout) {
                    clearTimeout(ctx.retrypauseTimeout);
                }
                if (ctx._pendingErrorWriteTimeout) {
                    clearTimeout(ctx._pendingErrorWriteTimeout);
                    ctx._pendingErrorWriteTimeout = null;
                }
                if (ctx.commandFailedResetTimeout) {
                    clearTimeout(ctx.commandFailedResetTimeout);
                    ctx.commandFailedResetTimeout = null;
                }
                if (ctx.unreachableRetryTimeout) {
                    clearTimeout(ctx.unreachableRetryTimeout);
                    ctx.unreachableRetryTimeout = null;
                }
                // Tracked init-get-states timer (set by registerReadyEvent).
                // Must be cleared so a delayed initial command burst cannot
                // fire after the adapter has been unloaded.
                if (ctx._initialGetStatesTimeout) {
                    clearTimeout(ctx._initialGetStatesTimeout);
                    ctx._initialGetStatesTimeout = null;
                }
            }
            if (this.globalMqttUnreachableTimeout) {
                clearTimeout(this.globalMqttUnreachableTimeout);
                this.globalMqttUnreachableTimeout = null;
            }
            if (this._deviceConnectionTimeout) {
                clearTimeout(this._deviceConnectionTimeout);
                this._deviceConnectionTimeout = null;
            }
            this.deviceContexts.clear();
            this.log.info('cleaned everything up...');
            callback();
        } catch (e) {
            this.log.error('Error during unload: ' + e.message);
            callback();
        }
    }

    async onMessage(obj) {
        this.log.info(`onMessage received: command=${obj?.command} from=${obj?.from}`);
        if (obj && obj.command === 'loginAndFetchDevices') {
            this.log.info('Received loginAndFetchDevices request from admin interface');
            try {
                const result = await this.loginAndFetchDevices(obj.message);
                this.sendTo(obj.from, obj.command, result, obj.callback);
            } catch (error) {
                this.log.error('Error in loginAndFetchDevices: ' + error.message);
                this.sendTo(obj.from, obj.command, {
                    error: error.message || 'Unknown error occurred',
                    result: null
                }, obj.callback);
            }
        } else if (obj && obj.command === 'getDeviceList') {
            this.log.info('Received getDeviceList request from admin interface');
            try {
                const result = await this.getDeviceList();
                this.sendTo(obj.from, obj.command, result, obj.callback);
            } catch (error) {
                this.log.error('Error in getDeviceList: ' + error.message);
                this.sendTo(obj.from, obj.command, [], obj.callback);
            }
        }
    }

    disconnect(ctx, disconnectVacbot) {
        this.setConnection(false);
        if (disconnectVacbot && ctx.vacbot) {
            ctx.vacbot.disconnect();
        }
    }

    async loginAndFetchDevices(credentials) {
        const { email, password, countrycode, authDomain } = credentials;
        
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        
        const passwordHash = EcoVacsAPI.md5(password);
        const deviceId = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync(), 0);
        const countryCode = (countrycode || 'de').toLowerCase();
        const continent = (ecovacsDeebot.countries)[countryCode.toUpperCase()]?.continent?.toLowerCase() || 'eu';
        const authDomainValue = authDomain || 'ecovacs.com';
        
        this.log.info(`Attempting login for device discovery: ${email} (${countryCode})`);
        
        try {
            const api = new EcoVacsAPI(deviceId, countryCode, continent, authDomainValue);
            await api.connect(email, passwordHash);
            const devices = await api.devices();
            
            const numberOfDevices = Object.keys(devices).length;
            this.log.info(`Device discovery successful. Found ${numberOfDevices} device(s)`);
            
            if (numberOfDevices === 0) {
                return {
                    error: null,
                    result: 'Login successful but no devices found'
                };
            }
            
            // Format device information for the admin interface
            const formattedDevices = devices.map((device, index) => ({
                number: index + 1,
                value: index,
                name: device.deviceName || device.name || 'Unknown Device',
                nick: device.nick || '',
                deviceName: device.deviceName || device.name || 'Unknown Device',
                deviceNick: device.nick || '',
                deviceClass: device.class || '',
                deviceType: this.getDeviceTypeFromDevice(device)
            }));
            
            return {
                error: null,
                result: `Found ${numberOfDevices} device(s)`,
                devices: formattedDevices
            };
        } catch (error) {
            this.log.error('Device discovery failed: ' + error.message);
            throw new Error('Login failed: ' + (error.message || 'Unknown error'));
        }
    }

    async getDeviceList() {
        // Read credentials from adapter config (decrypted by js-controller)
        const email = this.config.email || this.config?.native?.email || '';
        const password = this.password || this.config.password || this.config?.native?.password || '';
        const countrycode = this.config.countrycode || this.config?.native?.countrycode || 'de';
        const authDomain = this.config.authDomain || this.config?.native?.authDomain || '';

        if (!email || !password) {
            this.log.debug('getDeviceList: no credentials in adapter config, returning empty list');
            return [];
        }

        const passwordHash = EcoVacsAPI.md5(password);
        const deviceId = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync(), 0);
        const countryCode = (countrycode || 'de').toLowerCase();
        const continent = (ecovacsDeebot.countries)[countryCode.toUpperCase()]?.continent?.toLowerCase() || 'eu';
        const authDomainValue = authDomain || 'ecovacs.com';

        this.log.info(`Fetching device list for admin UI: ${email} (${countryCode})`);

        try {
            const api = new EcoVacsAPI(deviceId, countryCode, continent, authDomainValue);
            await api.connect(email, passwordHash);
            const devices = await api.devices();

            const numberOfDevices = Object.keys(devices).length;
            this.log.info(`Device list fetch successful. Found ${numberOfDevices} device(s)`);

            if (numberOfDevices === 0) {
                return [];
            }

            // Format devices for selectSendTo dropdown
            // Response must be [{value, label, (optional) description}, ...]
            return devices.map(device => {
                const deviceName = device.deviceName || device.name || 'Unknown Device';
                const displayName = device.nick
                    ? `${deviceName} (${device.nick})`
                    : deviceName;
                const deviceType = this.getDeviceTypeFromDevice(device);
                return {
                    value: device.did || device.name || 'unknown',
                    label: displayName,
                    description: `${deviceType} [${device.did || device.name || 'unknown'}]`
                };
            });
        } catch (error) {
            this.log.error('Failed to fetch device list for admin UI: ' + error.message);
            return [];
        }
    }

    onStateChange(id, state) {
        if (!state) return;
        const relativeId = id.replace(this.namespace + '.', '');
        const parts = relativeId.split('.');
        const deviceId = parts[0];

        // Single device mode: route ALL state changes to the single context
        if (this.config.singleDeviceMode) {
            const ctx = this.deviceContexts.values().next().value;
            if (!ctx) return;
            const stateName = parts[parts.length - 1];
            const subPath = relativeId;
            if (stateName === 'enabled' && subPath === 'status.enabled') {
                ctx.enabled = state.val;
                if (state.val) {
                    this.log.info(`Device control and updates enabled`);
                    if (ctx.connected) {
                        this.startPolling(ctx);
                    }
                } else {
                    this.log.info(`Device control and updates disabled`);
                    this.stopPolling(ctx);
                }
            }
            if (!ctx.enabled && stateName !== 'enabled') return;
            ctx._stateChangePromise = (ctx._stateChangePromise || Promise.resolve()).then(() =>
                adapterCommands.handleStateChange(this, ctx, relativeId, state)
            ).catch(e => this.log.error(`Error handling state change for id '${id}' with value '${state.val}': '${e}'`));
            return;
        }

        const ctx = this.deviceContexts.get(deviceId);
        if (!ctx) {
            return;
        }
        const subPath = parts.slice(1).join('.');
        const stateName = parts[parts.length - 1];
        if (stateName === 'enabled' && subPath === 'status.enabled') {
            ctx.enabled = state.val;
            if (state.val) {
                this.log.info(`Device ${deviceId}: control and updates enabled`);
                if (ctx.connected) {
                    this.startPolling(ctx);
                }
            } else {
                this.log.info(`Device ${deviceId}: control and updates disabled`);
                this.stopPolling(ctx);
            }
        }
        if (!ctx.enabled && stateName !== 'enabled') return;
        ctx._stateChangePromise = (ctx._stateChangePromise || Promise.resolve()).then(() =>
            adapterCommands.handleStateChange(this, ctx, subPath, state)
        ).catch(e => this.log.error(`Error handling state change for id '${id}' with value '${state.val}': '${e}'`));
    }    reconnect() {
        if (this._startupTime && (Date.now() - this._startupTime < C.STARTUP_GRACE_PERIOD_MS)) {
            this.log.debug('Reconnect skipped - startup grace period active');
            return;
        }
        if (this.authFailed) {
            this.log.warn('Reconnect skipped due to authentication failure. Please check your credentials and restart the adapter.');
            return;
        }
        const now = Date.now();
        if (this._lastReconnectTime && (now - this._lastReconnectTime < C.RECONNECT_COOLDOWN_MS)) {
            this.log.debug('Reconnect skipped - cooldown active (' + Math.round((now - this._lastReconnectTime) / 1000) + 's since last reconnect, minimum 60s)');
            return;
        }
        this._lastReconnectTime = now;
        for (const ctx of this.deviceContexts.values()) {
            this.clearGoToPosition(ctx);
            ctx.retrypauseTimeout = null;
            this.clearUnreachableRetry(ctx);
            ctx.retries++;
        }
        this.setConnection(false);
        for (const ctx1 of this.deviceContexts.values()) {
            if (ctx1.getGetPosInterval) {
                clearInterval(ctx1.getGetPosInterval);
                ctx1.getGetPosInterval = null;
            }
            if (ctx1.airDryingActiveInterval) {
                clearInterval(ctx1.airDryingActiveInterval);
                ctx1.airDryingActiveInterval = null;
            }
            // Tracked init-get-states timer (set by registerReadyEvent).
            // Must be cleared so a delayed initial command burst cannot
            // fire against a stale ctx after we recreate everything.
            if (ctx1._initialGetStatesTimeout) {
                clearTimeout(ctx1._initialGetStatesTimeout);
                ctx1._initialGetStatesTimeout = null;
            }
            this.stopPolling(ctx1);
            try {
                if (ctx1.vacbot) {
                    ctx1.vacbot.disconnect();
                    if (typeof ctx1.vacbot.removeAllListeners === 'function') {
                        ctx1.vacbot.removeAllListeners();
                    }
                }
            } catch (e) {
                // ignore cleanup errors
            }
        }
        this.deviceContexts.clear();
        if (this._deviceConnectionTimeout) {
            clearTimeout(this._deviceConnectionTimeout);
            this._deviceConnectionTimeout = null;
        }
        this.log.info('Reconnecting ...');
        this.connect();
    }

    async connect() {
        if (this._connecting) {
            this.log.debug('Connection already in progress, skipping concurrent connect()');
            return;
        }
        const connectNow = Date.now();
        if (this._lastConnectTime && (connectNow - this._lastConnectTime < C.CONNECT_COOLDOWN_MS)) {
            this.log.debug('Connect skipped - cooldown active (' + Math.round((connectNow - this._lastConnectTime) / 1000) + 's since last connect)');
            return;
        }
        this._connecting = true;
        this.connectionFailed = false;
        this._lastConnectTime = connectNow;

        if ((!this.config.email) || (!this.config.password) || (!this.config.countrycode)) {
            this.error('Missing values in adapter config', true);
            this._connecting = false;
            return;
        }
        if (this.config.pollingInterval && (Number(this.config.pollingInterval) >= C.MIN_POLLING_INTERVAL_MS)) {
            this.pollingInterval = Number(this.config.pollingInterval);
        }

        try {
            const password_hash = EcoVacsAPI.md5(this.password);
            const deviceId = EcoVacsAPI.getDeviceId(nodeMachineId.machineIdSync(), 0);
            const continent = (ecovacsDeebot.countries)[this.config.countrycode.toUpperCase()].continent.toLowerCase();

            let authDomain = '';
            if (this.getConfigValue('authDomain') !== '') {
                authDomain = this.getConfigValue('authDomain');
                this.log.info('Using login: ' + authDomain);
            }

            const api = new EcoVacsAPI(deviceId, this.config.countrycode, continent, authDomain);
            await api.connect(this.config.email, password_hash);
            const devices = await api.devices();

            const numberOfDevices = Object.keys(devices).length;
            if (numberOfDevices === 0) {
                this.log.warn('Successfully connected to Ecovacs server, but no devices found. Exiting ...');
                this.setConnection(false);
                this._connecting = false;
                return;
            }
            this.log.info('Successfully connected to Ecovacs server. Found ' + numberOfDevices + ' device(s) ...');
            this.setStateConditional('info.deviceDiscovery', JSON.stringify(devices.map((device, index) => ({
                number: index + 1,
                name: device.deviceName || device.name || 'Unknown Device',
                nick: device.nick || '',
                did: device.did || '',
                class: device.class,
                deviceType: this.getDeviceTypeFromDevice(device)
            }))), true);
            this.setStateConditional('info.deviceCount', numberOfDevices, true);

            let devicesToProcess = devices;
            let useSkipPrefix = false;
            const singleDeviceMode = this.config.singleDeviceMode;
            const singleDeviceId = this.config.singleDeviceId;

            if (singleDeviceMode && singleDeviceId) {
                const searchTerm = singleDeviceId.toLowerCase();
                const matchedDevice = devices.find(d => 
                    (d.did && d.did.toLowerCase() === searchTerm) ||
                    (d.nick && d.nick.toLowerCase() === searchTerm) ||
                    (d.deviceName && d.deviceName.toLowerCase() === searchTerm) ||
                    (d.name && d.name.toLowerCase() === searchTerm)
                );

                if (matchedDevice) {
                    const matchName = matchedDevice.nick || matchedDevice.deviceName || matchedDevice.did;
                    this.log.info('Single device mode: Using device ' + matchName + ' (did: ' + matchedDevice.did + ')');
                    devicesToProcess = [matchedDevice];
                    useSkipPrefix = true;
                } else {
                    this.log.warn('Single device mode: Could not find device matching ' + singleDeviceId + '. No devices will be connected.');
                    this._connecting = false;
                    return;
                }
            }

            for (let i = 0; i < devicesToProcess.length; i++) {
                const vacuum = devicesToProcess[i];
                const deviceId = vacuum.did.replace(/[^a-zA-Z0-9_]/g, '_');
                if (this.deviceContexts.has(deviceId)) {
                    this.log.debug('[' + deviceId + '] Device already connected, skipping');
                    continue;
                }
                const vacbot = api.getVacBot(api.uid, EcoVacsAPI.REALM, api.resource, api.user_access_token, vacuum, continent);
                const ctx = new DeviceContext(this, deviceId, vacbot, vacuum, this.requestThrottle, useSkipPrefix);
                ctx.vacuum = vacuum; ctx.api = api; ctx.model = new Model(vacbot, this.config); ctx.device = new Device(ctx);
                this.deviceContexts.set(deviceId, ctx);
                try {
                    const enabledState = await this.getStateAsync(ctx.statePath('status.enabled'));
                    if (enabledState && enabledState.val === false) ctx.enabled = false;
                } catch (e) {}
                try {
                    await adapterObjects.createInitialInfoObjects(this, ctx);
                    await adapterObjects.createInitialObjects(this, ctx);
                } catch (e) {
                    this.log.error('Error creating initial objects for ' + deviceId + ': ' + e.message);
                }
                const readyPromise = eventHandlers.registerReadyEvent(this, vacbot, ctx, vacuum);
                eventHandlers.registerChargeStateEvent(this, vacbot, ctx);
                eventHandlers.registerCleanReportEvent(this, vacbot, ctx);
                eventHandlers.registerWaterCleaningEvents(this, vacbot, ctx);
                eventHandlers.registerStationEvents(this, vacbot, ctx);
                eventHandlers.registerMiscEventHandlers(this, vacbot, ctx);
                eventHandlers.registerConsumableEvents(this, vacbot, ctx);
                eventHandlers.registerConnectionEvents(this, vacbot, ctx);
                eventHandlers.registerMapEvents(this, vacbot, ctx);
                eventHandlers.registerAirbotEvents(this, vacbot, ctx);
                if (this.globalMqttUnreachable) {
                    this.log.debug(ctx.deviceId + '] Skipping vacbot.connect() - MQTT server globally unreachable');
                } else {
                    vacbot.connect();
                }
                if (ctx.enabled) this.startPolling(ctx);
                await readyPromise;
                if (i < devicesToProcess.length - 1) {
                    this.log.info('Staggering next device connection in ' + (C.DEVICE_CONNECTION_DELAY_MS / 1000) + 's...');
                    await new Promise(resolve => {
                        this._deviceConnectionTimeout = setTimeout(resolve, C.DEVICE_CONNECTION_DELAY_MS);
                    });
                }
            }
            this._connecting = false;
        } catch (e) {
            this._connecting = false;
            this.connectionFailed = true;
            if (this.isAuthError(e.message)) {
                this.authFailed = true;
                this.log.error('Authentication failed. Retrying will not be attempted until the adapter is restarted or credentials are updated.');
            }
            this.error(e.message, true);
        }
    }

    _flushPendingPosition(ctx) {
        if (ctx._pendingPosition) {
            this.handlePositionObj(ctx, ctx._pendingPosition);
            ctx._pendingPosition = null;
        }
    }

    setConnection(value) {
        this.setStateConditional('info.connection', value, true);
        if (value === false) {
            for (const ctx of this.deviceContexts.values()) {
                this.updateDeviceConnectionState(ctx, false);
                if (ctx.retrypauseTimeout) {
                    clearTimeout(ctx.retrypauseTimeout);
                    ctx.retrypauseTimeout = null;
                }
                this.stopPolling(ctx);
                if (ctx.getGetPosInterval) {
                    clearInterval(ctx.getGetPosInterval);
                    ctx.getGetPosInterval = null;
                }
                if (ctx.airDryingActiveInterval) {
                    clearInterval(ctx.airDryingActiveInterval);
                    ctx.airDryingActiveInterval = null;
                }
            }
        } else {
            this.connectedTimestamp = helper.getUnixTimestamp();
            this.setStateConditional('info.connectionUptime', 0, true);
        }
        this.connected = value;
    }

    updateConnectionState() {
        const anyConnected = Array.from(this.deviceContexts.values()).some(c => c.connected);
        this.setStateConditional('info.connection', anyConnected, true);
        this.connected = anyConnected;
        if (anyConnected) {
            this.connectedTimestamp = helper.getUnixTimestamp();
        }
    }

    updateDeviceConnectionState(ctx, value) {
        ctx.adapterProxy.setStateConditional('info.connection', value, true);
        if (value) {
            ctx.connectedTimestamp = helper.getUnixTimestamp();
            ctx.adapterProxy.setStateConditional('info.connectionUptime', 0, true);
            ctx._lastUptimeValue = 0;
        } else {
            ctx.connectedTimestamp = 0;
            ctx.adapterProxy.setStateConditional('info.connectionUptime', 0, true);
            ctx._lastUptimeValue = 0;
        }
    }

    /**
     * Marks ALL devices as unreachable when the MQTT server itself goes offline.
     * Sets a global flag so no further requests are sent from any device until
     * connectivity is restored. Uses backoff retry schedule (30s, 60s, 5min).
     * Only logs the "MQTT server is offline" warning once globally.
     * @param {object} ctx - The DeviceContext that detected the MQTT offline condition
     */
    setGlobalMqttUnreachable(ctx) {
        if (this.globalMqttUnreachable) {
            return; // already in global unreachable state
        }

        this.globalMqttUnreachable = true;
        const nick = ctx.vacuum.nick || ctx.deviceId;
        const model = ctx.getModel().getProductName();

        // Log the warning once globally (not per-device)
        if (!this.globalMqttOfflineWarningSent) {
            this.log.warn(`[${nick} (${model})] MQTT server is offline or not reachable. Pausing ALL device communication until server is reachable again.`);
            this.globalMqttOfflineWarningSent = true;
        }

        // Mark ALL devices as unreachable so queues and polling are stopped
        for (const deviceCtx of this.deviceContexts.values()) {
            deviceCtx.connectionFailed = true;
            if (!deviceCtx.unreachableWarningSent) {
                deviceCtx.unreachableWarningSent = true;
            }
        }
        this.setConnection(false);

        // Schedule a single global retry instead of per-device retries
        this.scheduleGlobalMqttRetry();
    }

    /**
     * Clears the global MQTT unreachable state when any device successfully
     * receives data, indicating the MQTT server is back online.
     */
    clearGlobalMqttUnreachable() {
        if (!this.globalMqttUnreachable) {
            return;
        }

        this.log.info('MQTT server is reachable again. Resuming communication for all devices.');
        this.globalMqttUnreachable = false;
        this.globalMqttUnreachableCount = 0;
        this.globalMqttOfflineWarningSent = false;

        if (this.globalMqttUnreachableTimeout) {
            clearTimeout(this.globalMqttUnreachableTimeout);
            this.globalMqttUnreachableTimeout = null;
        }
    }

    /**
     * Schedules a single global retry that attempts to reconnect ALL devices.
     * Uses backoff: 30s, 60s, then 5min for all subsequent retries.
     */
    scheduleGlobalMqttRetry() {
        if (this.globalMqttUnreachableTimeout) {
            return;
        }
        // Prevent reconnect triggered by stale states during adapter startup
        if (this._startupTime && (Date.now() - this._startupTime < C.STARTUP_GRACE_PERIOD_MS)) {
            this.log.debug('Reconnect skipped - startup grace period active');
            return;
        }
        if (this.authFailed) {
            return;
        }

        const BACKOFF_SCHEDULE = C.BACKOFF_SCHEDULE;
        const retryIndex = Math.min(this.globalMqttUnreachableCount, BACKOFF_SCHEDULE.length - 1);
        const delay = BACKOFF_SCHEDULE[retryIndex];
        this.globalMqttUnreachableCount++;

        this.log.debug(`[Global] MQTT server unreachable. Scheduling global retry #${this.globalMqttUnreachableCount} in ${Math.round(delay / 1000)}s`);

        this.globalMqttUnreachableTimeout = setTimeout(() => {
            this.globalMqttUnreachableTimeout = null;
            this.log.debug(`[Global] Executing global MQTT reconnect attempt #${this.globalMqttUnreachableCount}`);

            // Try to reconnect ALL devices.
            //
            // IMPORTANT: vacbot.connect() in the upstream ecovacs-deebot
            // library does NOT close the previous MQTT client - it just
            // overwrites this.client with a new one, leaking the old client.
            // Each leaked client keeps subscribing/emitting 'ready' on its
            // own auto-reconnects, multiplying load over time.
            //
            // We therefore explicitly disconnect first, swallowing any error
            // (a not-yet-subscribed client will reject from disconnect()),
            // and only then re-issue connect().
            let reconnectCount = 0;
            for (const deviceCtx of this.deviceContexts.values()) {
                if (!deviceCtx.connected || deviceCtx.connectionFailed) {
                    // Per-device error containment: a sync throw from
                    // _reconnectVacbotSafely (which re-throws connect()
                    // failures) must NOT abort the iteration over the
                    // remaining devices.
                    try {
                        this._reconnectVacbotSafely(deviceCtx, '[Global] ');
                        reconnectCount++;
                    } catch (e) {
                        this.log.debug(`[Global] Reconnect failed for ${deviceCtx.deviceId}: ${e && e.message}`);
                    }
                }
            }

            if (reconnectCount === 0) {
                // All devices already connected, clear global state
                this.clearGlobalMqttUnreachable();
            }
        }, delay);
    }

    /**
     * Tracks consecutive command failures per device.
     * After 2+ failures, marks the device as unreachable and schedules a retry.
     * Resets the counter after a period without failures (60s timeout).
     * @param {object} ctx - DeviceContext
     */
    incrementCommandFailedCount(ctx) {
        ctx.commandFailedCount++;

        // Reset the counter after 60 seconds of no failures
        if (ctx.commandFailedResetTimeout) {
            clearTimeout(ctx.commandFailedResetTimeout);
        }
        ctx.commandFailedResetTimeout = setTimeout(() => {
            ctx.commandFailedCount = 0;
            ctx.commandFailedResetTimeout = null;
        }, C.COMMAND_FAILURE_RESET_TIMEOUT_MS);

        // After 2+ consecutive failures, mark device as unreachable
        if (ctx.commandFailedCount >= 2 && !ctx.connectionFailed) {
            const nick = ctx.vacuum.nick || ctx.deviceId;
            const model = ctx.getModel().getProductName();
            this.log.warn(`[${nick} (${model})] ${ctx.commandFailedCount} consecutive command failures. Marking device as unreachable.`);
            ctx.connectionFailed = true;
            if (!ctx.unreachableWarningSent) {
                ctx.unreachableWarningSent = true;
            }
            this.scheduleUnreachableRetry(ctx);
        }
    }

    scheduleUnreachableRetry(ctx) {
        // If we are in global MQTT unreachable state, skip per-device retry
        // The global retry mechanism will reconnect all devices at once
        if (this.globalMqttUnreachable) {
            this.log.silly(`[${ctx.vacuum.nick || ctx.deviceId}] Skipping per-device retry - global MQTT retry in progress`);
            return;
        }
        if (ctx.unreachableRetryTimeout) { return; }
        // Prevent reconnect triggered by stale states during adapter startup
        if (this._startupTime && (Date.now() - this._startupTime < C.STARTUP_GRACE_PERIOD_MS)) {
            this.log.debug('Reconnect skipped - startup grace period active');
            return;
        }
        if (this.authFailed) { return; }

        // Backoff schedule: 30s, 60s, then 5min for all subsequent retries
        const BACKOFF_SCHEDULE = C.BACKOFF_SCHEDULE;
        const retryIndex = Math.min(ctx.unreachableRetryCount, BACKOFF_SCHEDULE.length - 1);
        const delay = BACKOFF_SCHEDULE[retryIndex];
        ctx.unreachableRetryCount++;

        const nick = ctx.vacuum.nick || ctx.deviceId;
        const model = ctx.getModel().getProductName();
        this.log.debug(`[${nick} (${model})] Device unreachable. Scheduling retry #${ctx.unreachableRetryCount} in ${Math.round(delay / 1000)}s`);
        ctx.unreachableRetryTimeout = setTimeout(() => {
            ctx.unreachableRetryTimeout = null;
            const retryNick = ctx.vacuum.nick || ctx.deviceId;
            const retryModel = ctx.getModel().getProductName();
            this.log.debug(`[${retryNick} (${retryModel})] Executing reconnect attempt #${ctx.unreachableRetryCount}`);
            try {
                // See _reconnectVacbotSafely for why we disconnect first.
                this._reconnectVacbotSafely(ctx, `[${retryNick} (${retryModel})] `);
            } catch (e) {
                this.log.warn(`[${retryNick} (${retryModel})] Reconnect failed: ${e.message}`);
                this.scheduleUnreachableRetry(ctx);
            }
        }, delay);
    }

    /**
     * Cleanly reconnect a vacbot's MQTT client.
     *
     * The upstream ecovacs-deebot library's vacbot.connect() always creates
     * a new internal MQTT client and overwrites the previous reference
     * without disconnecting it. Without an explicit disconnect, repeated
     * retry paths (per-device or global) accumulate parallel MQTT clients,
     * each subscribing and re-emitting 'ready' on every auto-reconnect.
     * Over days of uptime this manifests as multiple simultaneous device
     * (re-)initializations and a flood of polling commands.
     *
     * This helper performs disconnect() first (best-effort - errors are
     * intentionally swallowed because a not-yet-fully-subscribed client
     * will reject from disconnect()) and then issues connect().
     *
     * @param {object} ctx        - DeviceContext
     * @param {string} [logPrefix] - prefix for debug logs
     */
    _reconnectVacbotSafely(ctx, logPrefix) {
        const prefix = logPrefix || '';
        if (!ctx || !ctx.vacbot) return;
        try {
            const result = ctx.vacbot.disconnect && ctx.vacbot.disconnect();
            if (result && typeof result.then === 'function') {
                result.catch(e => {
                    this.log.silly(`${prefix}disconnect() before reconnect rejected: ${e && e.message}`);
                });
            }
        } catch (e) {
            this.log.silly(`${prefix}disconnect() before reconnect threw: ${e && e.message}`);
        }
        try {
            ctx.vacbot.connect();
        } catch (e) {
            this.log.debug(`${prefix}connect() failed: ${e && e.message}`);
            throw e;
        }
    }

    clearUnreachableRetry(ctx) {
        if (ctx.unreachableRetryTimeout) {
            clearTimeout(ctx.unreachableRetryTimeout);
            ctx.unreachableRetryTimeout = null;
        }
        ctx.unreachableRetryCount = 0;
        ctx.connectionFailed = false;
        // Reset consecutive command failure tracking
        ctx.commandFailedCount = 0;
        if (ctx.commandFailedResetTimeout) {
            clearTimeout(ctx.commandFailedResetTimeout);
            ctx.commandFailedResetTimeout = null;
        }
    }

    /**
     * Called when a device that was previously unreachable sends data (event or successful response).
     * Resets the unreachable state and triggers an immediate re-fetch of device states.
     * Uses a per-device debounce to prevent rapid re-entry during burst recovery events.
     * @param {object} ctx - DeviceContext
     */
    handleDeviceDataReceived(ctx) {
        // If any device receives data while global MQTT unreachable is set,
        // it means the MQTT server is back online - clear the global state
        if (this.globalMqttUnreachable) {
            this.clearGlobalMqttUnreachable();
        }

        if (!ctx.connectionFailed && ctx.connected) {
            return; // Device was already in good state, nothing to reset
        }

        // Debounce: ignore if recovery was already triggered within the last 5 seconds
        const now = Date.now();
        if (ctx._lastRecoveryTimestamp && (now - ctx._lastRecoveryTimestamp < C.RECOVERY_DEBOUNCE_MS)) {
            return;
        }
        ctx._lastRecoveryTimestamp = now;

        const nick = ctx.vacuum.nick || ctx.deviceId;
        const model = ctx.getModel().getProductName();
        this.log.info(`[${nick} (${model})] Device is reachable again - received data. Resetting unreachable state and re-fetching states.`);

        // Clear any pending retry
        this.clearUnreachableRetry(ctx);

        // Mark device as connected
        ctx.connected = true;
        ctx.unreachableWarningSent = false;
        this.updateDeviceConnectionState(ctx, true);
        this.updateConnectionState();

        // Re-fetch device states immediately since some may have been missed
        setTimeout(() => {
            if (ctx.connected && !ctx.connectionFailed) {
                this.log.debug(`[${nick}] Triggering state re-fetch after recovery`);
                ctx.commandQueue.addStandardGetCommands();
                ctx.commandQueue.runAll();
            }
        }, 2000);
    }

    resetCurrentStats(ctx) {
        if (ctx.getModel().usesMqtt()) {
            this.log.debug('Reset current cleaninglog stats');
            ctx.adapterProxy.setStateConditional('cleaninglog.current.cleanedArea', 0, true);
            ctx.adapterProxy.setStateConditional('cleaninglog.current.cleanedSeconds', 0, true);
            ctx.adapterProxy.setStateConditional('cleaninglog.current.cleanedTime', '0h 00m 00s', true);
            ctx.adapterProxy.setStateConditional('cleaninglog.current.cleanType', '', true);
            ctx.currentCleanedSeconds = 0;
            ctx.currentCleanedArea = 0;
            ctx.silentApproach = {};
        }
    }

    resetErrorStates(ctx) {
        if (ctx._pendingErrorWriteTimeout) {
            clearTimeout(ctx._pendingErrorWriteTimeout);
            ctx._pendingErrorWriteTimeout = null;
        }
        ctx.errorCode = '0';
        ctx.adapterProxy.setStateConditional('info.errorCode', ctx.errorCode, true);
        ctx.adapterProxy.setStateConditional('info.error', 'NoError: Robot is operational', true);
    }

    debouncedSetError(ctx, code, error) {
        if (ctx._pendingErrorWriteTimeout) {
            clearTimeout(ctx._pendingErrorWriteTimeout);
        }
        ctx.errorCode = code;
        ctx._pendingErrorWriteTimeout = setTimeout(() => {
            ctx._pendingErrorWriteTimeout = null;
            ctx.adapterProxy.setStateConditional('info.errorCode', ctx.errorCode, true);
            ctx.adapterProxy.setStateConditional('info.error', error, true);
        }, 5000);
    }

    clearGoToPosition(ctx) {
        ctx.adapterProxy.setStateConditional('control.extended.goToPosition', '', true);
        ctx.goToPositionArea = null;
    }

    async setInitialStateValues(ctx) {
        this.resetErrorStates(ctx);
        this.resetCurrentStats(ctx);
        // Fetch all initial states in parallel for performance
        const stateKeys = [
            'info.cleanstatus',
            'info.chargestatus',
            'map.currentMapMID',
            'control.customArea_cleanings',
            'control.spotArea_cleanings',
            'control.waterLevel',
            'control.cleanSpeed',
            'control.extended.pauseWhenEnteringSpotArea',
            'control.extended.pauseWhenLeavingSpotArea',
            'info.waterboxinfo',
            'map.chargePosition',
            'map.deebotPosition',
            'control.extended.pauseBeforeDockingChargingStation',
            'control.extended.resetCleanSpeedToStandardOnReturn',
            'control.extended.cleaningClothReminder',
            'control.extended.cleaningClothReminder_period',
            'info.extended.airDryingDateTime.startTimestamp'
        ];

        const results = await Promise.all(
            stateKeys.map(key => ctx.adapterProxy.getStateAsync(key).catch(() => null))
        );

        // Apply results in same order as stateKeys array
        for (let i = 0; i < stateKeys.length; i++) {
            const state = results[i];
            switch (stateKeys[i]) {
                case 'info.cleanstatus':
                    if (state && state.val) ctx.cleanstatus = state.val.toString();
                    break;
                case 'info.chargestatus':
                    if (state && state.val) ctx.chargestatus = state.val.toString();
                    break;
                case 'map.currentMapMID':
                    if (state && state.val) ctx.currentMapID = state.val.toString();
                    break;
                case 'control.customArea_cleanings':
                    if (state && state.val) ctx.customAreaCleanings = Number(state.val);
                    break;
                case 'control.spotArea_cleanings':
                    if (state && state.val) ctx.spotAreaCleanings = Number(state.val);
                    break;
                case 'control.waterLevel':
                    if (state && state.val) ctx.waterLevel = Math.round(Number(state.val));
                    break;
                case 'control.cleanSpeed':
                    if (state && state.val) ctx.cleanSpeed = Math.round(Number(state.val));
                    break;
                case 'control.extended.pauseWhenEnteringSpotArea':
                    if (state && state.val) ctx.pauseWhenEnteringSpotArea = state.val.toString();
                    break;
                case 'control.extended.pauseWhenLeavingSpotArea':
                    if (state && state.val) ctx.pauseWhenLeavingSpotArea = state.val.toString();
                    break;
                case 'info.waterboxinfo':
                    if (state && state.val) ctx.waterboxInstalled = (state.val === true);
                    break;
                case 'map.chargePosition':
                    if (state && state.val) ctx.chargePosition = state.val;
                    break;
                case 'map.deebotPosition':
                    if (state && state.val) ctx.deebotPosition = state.val;
                    break;
                case 'control.extended.pauseBeforeDockingChargingStation':
                    if (state && state.val) ctx.pauseBeforeDockingChargingStation = (state.val === true);
                    break;
                case 'control.extended.resetCleanSpeedToStandardOnReturn':
                    if (state && state.val) ctx.resetCleanSpeedToStandardOnReturn = (state.val === true);
                    break;
                case 'control.extended.cleaningClothReminder':
                    if (state && state.val) ctx.cleaningClothReminder.enabled = Boolean(Number(state.val));
                    break;
                case 'control.extended.cleaningClothReminder_period':
                    if (state && state.val) ctx.cleaningClothReminder.period = Number(state.val);
                    break;
                case 'info.extended.airDryingDateTime.startTimestamp':
                    if (state && state.val) ctx.airDryingStartTimestamp = Number(state.val);
                    break;
            }
        }

        await this.initLast20Errors(ctx);
        await this.setPauseBeforeDockingIfWaterboxInstalled(ctx);
    }

    async initLast20Errors(ctx) {
        /** @type {Object} */
        const state = await ctx.adapterProxy.getStateAsync('history.last20Errors');
        if (state && state.val) {
            if (state.val !== '') {
                /** @type {string} */
                const obj = state.val;
                ctx.last20Errors = JSON.parse(obj);
            }
        }
    }

    addToLast20Errors(ctx, code, error) {
        const obj = {
            'timestamp': helper.getUnixTimestamp(),
            'date': this.getCurrentDateAndTimeFormatted(),
            'code': code,
            'error': error
        };
        ctx.last20Errors.unshift(obj);
        if (ctx.last20Errors.length > 20) {
            ctx.last20Errors.pop();
        }
        ctx.adapterProxy.setStateConditional('history.last20Errors', JSON.stringify(ctx.last20Errors), true);
    }

    async setPauseBeforeDockingIfWaterboxInstalled(ctx) {
        const state = await ctx.adapterProxy.getStateAsync('control.extended.pauseBeforeDockingIfWaterboxInstalled');
        if (state) {
            ctx.pauseBeforeDockingIfWaterboxInstalled = (state.val === true);
        }
    }

    setStateConditional(stateId, value, ack = true, native) {
        if (helper.isIdValid(stateId)) {
            if (value === undefined) {
                this.log.warn("setStateConditional: value for state id '" + stateId + "' is undefined");
                return;
            }
            const _dotIdx = stateId.indexOf('.');
            if (_dotIdx > 0) {
                let _cacheCtx = null;
                if (this.config.singleDeviceMode) {
                    // In single device mode, use the single context for cache lookup
                    _cacheCtx = this.deviceContexts.values().next().value;
                } else {
                    const _deviceId = stateId.substring(0, _dotIdx);
                    _cacheCtx = this.deviceContexts.get(_deviceId);
                }
                if (_cacheCtx && _cacheCtx._stateValues) {
                    // In single device mode, the entire stateId is the cache key
                    const cacheKey = this.config.singleDeviceMode ? stateId : stateId.substring(_dotIdx + 1);
                    const _cachedVal = _cacheCtx._stateValues.get(cacheKey);
                    if (_cachedVal === value && !native) {
                        return;
                    }
                }
            }
            // Ensure object exists before setting state
            this.getObject(stateId, (err, obj) => {
                if (err || !obj) {
                    this.log.silly("setStateConditional: object '" + stateId + "' does not exist yet, skipping");
                    return;
                }
                this.getState(stateId, (err2, state) => {
                    if (!err2) {
                        if (!state || (ack && !state.ack) || (state.val !== value) || native) {
                            this.setState(stateId, value, ack);
                            if (_dotIdx > 0) {
                                let _cacheCtx2 = null;
                                if (this.config.singleDeviceMode) {
                                    _cacheCtx2 = this.deviceContexts.values().next().value;
                                } else {
                                    const _deviceId2 = stateId.substring(0, stateId.indexOf('.'));
                                    _cacheCtx2 = this.deviceContexts.get(_deviceId2);
                                }
                                if (_cacheCtx2 && _cacheCtx2._stateValues) {
                                    const cacheKey = this.config.singleDeviceMode ? stateId : stateId.substring(stateId.indexOf('.') + 1);
                                    _cacheCtx2._stateValues.set(cacheKey, value);
                                }
                            }
                            if (native) {
                                this.extendObject(
                                    stateId, {
                                        native: native
                                    });
                            }
                        } else {
                            this.log.silly("setStateConditional: '" + stateId + "' unchanged");
                        }
                    }
                });
            });
        } else {
            this.log.warn("setStateConditional: state id '" + stateId + "' not valid");
        }
    }

    async setStateConditionalAsync(stateId, value, ack = true, native) {
        if (helper.isIdValid(stateId)) {
            if (value === undefined) {
                this.log.warn("setStateConditionalAsync: value for state id '" + stateId + "' is undefined");
                return;
            }
            const _dotIdx2 = stateId.indexOf('.');
            if (_dotIdx2 > 0) {
                let _cacheCtx2 = null;
                if (this.config.singleDeviceMode) {
                    // In single device mode, use the single context for cache lookup
                    _cacheCtx2 = this.deviceContexts.values().next().value;
                } else {
                    const _deviceId2 = stateId.substring(0, _dotIdx2);
                    _cacheCtx2 = this.deviceContexts.get(_deviceId2);
                }
                if (_cacheCtx2 && _cacheCtx2._stateValues) {
                    // In single device mode, the entire stateId is the cache key
                    const cacheKey = this.config.singleDeviceMode ? stateId : stateId.substring(_dotIdx2 + 1);
                    const _cachedVal2 = _cacheCtx2._stateValues.get(cacheKey);
                    if (_cachedVal2 === value && !native) {
                        return;
                    }
                }
            }
            // Ensure object exists before setting state
            const obj = await this.getObjectAsync(stateId);
            if (!obj) {
                this.log.silly("setStateConditionalAsync: object '" + stateId + "' does not exist yet, skipping");
                return;
            }
            const state = await this.getStateAsync(stateId);
            if (!state || (ack && !state.ack) || (state.val !== value) || native) {
                this.setState(stateId, value, ack);
                if (_dotIdx2 > 0) {
                    let _cacheCtx3 = null;
                    if (this.config.singleDeviceMode) {
                        _cacheCtx3 = this.deviceContexts.values().next().value;
                    } else {
                        const _deviceId3 = stateId.substring(0, stateId.indexOf('.'));
                        _cacheCtx3 = this.deviceContexts.get(_deviceId3);
                    }
                    if (_cacheCtx3 && _cacheCtx3._stateValues) {
                        const cacheKey = this.config.singleDeviceMode ? stateId : stateId.substring(stateId.indexOf('.') + 1);
                        _cacheCtx3._stateValues.set(cacheKey, value);
                    }
                }
                if (native) {
                    this.extendObject(
                        stateId, {
                            native: native
                        });
                }
            }
        } else {
            this.log.warn('setStateConditionalAsync() id not valid: ' + stateId);
        }
    }

    setDeviceStatusByTrigger(ctx, trigger) {
        ctx.getDevice().setStatusByTrigger(trigger);
        ctx.adapterProxy.setStateConditional('info.deviceStatus', ctx.getDevice().status, true);
        ctx.adapterProxy.setStateConditional('status.device', ctx.getDevice().status, true);
        if (ctx.getDevice().isReturning() && ctx.resetCleanSpeedToStandardOnReturn) {
            if (ctx.getModel().isSupportedFeature('control.resetCleanSpeedToStandardOnReturn') &&
                ctx.getModel().isSupportedFeature('control.cleanSpeed')) {
                adapterCommands.runSetCleanSpeed(this, ctx, 2);
            }
        }
        this.setStateValuesOfControlButtonsByDeviceStatus(ctx);
    }

    setStateValuesOfControlButtonsByDeviceStatus(ctx) {
        let charge, stop, pause, clean;
        charge = stop = pause = clean = false;
        switch (ctx.getDevice().status) {
            case 'charging':
                charge = true;
                stop = true;
                break;
            case 'paused':
                pause = true;
                break;
            case 'stopped':
            case 'error':
                stop = true;
                break;
            case 'cleaning':
                clean = true;
                break;
        }
        ctx.adapterProxy.setStateConditional('control.charge', charge, true);
        ctx.adapterProxy.setStateConditional('control.stop', stop, true);
        ctx.adapterProxy.setStateConditional('control.pause', pause, true);
        ctx.adapterProxy.setStateConditional('control.clean', clean, true);
    }

    vacbotInitialGetStates(ctx) {
        ctx.commandQueue.addInitialGetCommands();
        ctx.commandQueue.addStandardGetCommands();
        ctx.commandQueue.runAll();
    }

    vacbotGetStatesInterval(ctx) {
        // Skip polling when global MQTT unreachable or device not connected
        if (this.globalMqttUnreachable || ctx.connectionFailed || !ctx.connected || !ctx.enabled) {
            const nick = ctx.vacuum.nick || ctx.deviceId;
            this.log.debug(`[${nick}] Skipping polling interval - device unreachable (connectionFailed=${ctx.connectionFailed}, connected=${ctx.connected}, enabled=${ctx.enabled})`);
            return;
        }
        ctx.intervalQueue.addStandardGetCommands();
        ctx.intervalQueue.addAdditionalGetCommands();
        ctx.intervalQueue.runAll();
    }

    startPolling(ctx) {
        if (ctx._autoUpdateInterval) {
            return;
        }
        const interval = Math.max(this.pollingInterval, C.MIN_POLLING_INTERVAL_MS);
        ctx._autoUpdateInterval = setInterval(() => {
            if (this.globalMqttUnreachable || ctx.connectionFailed || !ctx.connected || !ctx.enabled) {
                return;
            }
            this.vacbotGetStatesInterval(ctx);
        }, interval);
        this.log.debug(ctx.deviceId + ' Polling every ' + (interval / 1000) + 's');
    }

    stopPolling(ctx) {
        if (ctx._autoUpdateInterval) {
            clearInterval(ctx._autoUpdateInterval);
            ctx._autoUpdateInterval = null;
        }
    }

    getModelType(ctx) {
        return ctx.getModel().getModelType();
    }

    /**
     * Get device type from device object for discovery cache
     * @param {object} device - Device object from API
     * @returns {string} Device type classification
     */
    getDeviceTypeFromDevice(device) {
        if (device.deviceName) {
            if (device.deviceName.includes('Airbot') || device.deviceName.includes('AVA') || device.deviceName.includes('ANDY')) {
                return 'Air Purifier';
            }
            if (device.deviceName.includes('Air Quality') || device.deviceName.includes('Z1 Air')) {
                return 'Air Quality Monitor';
            }
            if (device.deviceName.includes('GOAT') || device.deviceName.includes('Goat')) {
                return 'Lawn Mower';
            }
            if (device.deviceName.includes('WINBOT') || device.deviceName.includes('Winbot')) {
                return 'Window Cleaner';
            }
        }
        return 'Vacuum Cleaner';
    }

    /**
     * Migrate legacy native config keys that cause dot-notation collisions.
     * Renames:
     *   - 'feature.map.virtualBoundaries'       -> 'feature.map.virtualBoundariesRead'
     *   - 'feature.map.virtualBoundaries.write' -> 'feature.map.virtualBoundariesWrite'
     * The old keys collide during admin UI dot-notation unflattening,
     * causing React error #31.
     */
    async migrateNativeConfig() {
        const renames = [
            ['feature.map.virtualBoundaries', 'feature.map.virtualBoundariesRead'],
            ['feature.map.virtualBoundaries.write', 'feature.map.virtualBoundariesWrite']
        ];

        const migrateNative = (native) => {
            let changed = false;
            for (const [oldKey, newKey] of renames) {
                if (native[oldKey] !== undefined) {
                    native[newKey] = native[oldKey] || '';
                    delete native[oldKey];
                    changed = true;
                }
            }
            return changed;
        };

        try {
            // 1. Fix the adapter definition object (native defaults)
            const adapterObj = await this.getForeignObjectAsync('system.adapter.ecovacs-deebot');
            if (adapterObj) {
                let changed = false;
                if (adapterObj.native) changed = migrateNative(adapterObj.native) || changed;
                if (adapterObj.common && adapterObj.common.native) changed = migrateNative(adapterObj.common.native) || changed;
                if (changed) {
                    await this.setForeignObjectAsync('system.adapter.ecovacs-deebot', adapterObj);
                    this.log.info('Migrated adapter definition object');
                }
            }

            // 2. Fix all instance objects
            for (let i = 0; i <= 99; i++) {
                const id = 'system.adapter.ecovacs-deebot.' + i;
                try {
                    const obj = await this.getForeignObjectAsync(id);
                    if (!obj || !obj.native) continue;
                    if (migrateNative(obj.native)) {
                        await this.setForeignObjectAsync(id, obj);
                        this.log.info('Migration completed for ' + id);
                    }
                } catch (e) {
                    // Instance does not exist or access error, skip
                }
            }
        } catch (e) {
            this.log.warn('Migration error: ' + e.message);
        }
    }

    getConfigValue(cv) {
        if (this.config[cv]) {
            return this.config[cv];
        }
        return '';
    }

    isAuthError(message) {
        if (typeof message !== 'string') {
            return false;
        }
        const authErrorPatterns = [
            /code 1010/i,
            /incorrect account or password/i,
            /invalid.*credentials/i,
            /authentication.*failed/i,
            /unauthorized/i
        ];
        return authErrorPatterns.some((pattern) => pattern.test(message));
    }

    error(message, stop) {
        if (stop) {
            this.setConnection(false);
        }
        const pattern = /code 0002/;
        if (pattern.test(message)) {
            message = 'reconnecting';
        } else {
            this.log.error(message);
        }
        this.errorCode = '-9';
        this.setStateConditional('info.errorCode', this.errorCode, true);
        this.setStateConditional('info.error', message, true);
    }

    async createChannelNotExists(id, name) {
        if (id === undefined) {
            this.log.warn(`createChannelNotExists() id is undefined. Using id: 'unknown'`);
            id = 'unknown';
        }
        if (name === undefined) {
            this.log.warn(`createChannelNotExists() name is undefined. Using name: 'unknown'`);
            name = 'unknown';
        }
        await this.setObjectNotExistsAsync(id, {
            type: 'channel',
            common: {
                name: name
            },
            native: {}
        });
    }

    async deleteChannelIfExists(id) {
        const obj = await this.getObjectAsync(id);
        if (obj) {
            await this.delObjectAsync(obj._id);
        }
    }

    async deleteObjectIfExists(id) {
        const obj = await this.getObjectAsync(id);
        if (obj) {
            await this.delObjectAsync(id);
        }
    }

    async createObjectNotExists(id, name, type, role, write, def, unit = '') {
        if (helper.isIdValid(id)) {
            await this.setObjectNotExistsAsync(id, {
                type: 'state',
                common: {
                    name: name,
                    type: type,
                    role: role,
                    read: true,
                    write: write,
                    def: def,
                    unit: unit
                },
                native: {}
            });
        } else {
            this.log.warn('createObjectNotExists() id not valid: ' + id);
        }
    }

    /**
     * Returns whether the robot is currently cleaning specific spot areas
     * and the current spot area is part of the cleaning process
     * @returns {Promise<boolean>}
     */
    async isCurrentSpotAreaPartOfCleaningProcess(ctx) {
        if (ctx.getDevice().isNotCleaning()) {
            return false;
        }
        if (ctx.cleanstatus !== 'spot_area') {
            return true;
        }
        if (ctx.currentSpotAreaID === 'unknown') {
            return false;
        }
        let spotAreaArray = [];
        const state = await ctx.adapterProxy.getStateAsync('map.currentUsedSpotAreas');
        if (state && state.val) {
            spotAreaArray = state.val.toString().split(',');
        }
        const isPartOfCleaningProcess = spotAreaArray.includes(ctx.currentSpotAreaID);
        if (!isPartOfCleaningProcess) {
            this.log.debug('Spot Area ' + ctx.currentSpotAreaID + ' is not part of the cleaning process');
        }
        return isPartOfCleaningProcess;
    }

    getPauseBeforeDockingChargingStationAreaSize() {
        if (this.getConfigValue('feature.pauseBeforeDockingChargingStation.areasize')) {
            return Number(this.getConfigValue('feature.pauseBeforeDockingChargingStation.areasize'));
        }
        return 500;
    }

    getPauseBeforeDockingSendPauseOrStop() {
        let sendPauseOrStop = 'pause';
        if (this.getConfigValue('feature.pauseBeforeDockingChargingStation.pauseOrStop')) {
            sendPauseOrStop = this.getConfigValue('feature.pauseBeforeDockingChargingStation.pauseOrStop');
        }
        return sendPauseOrStop;
    }

    getHoursUntilDustBagEmptyReminderFlagIsSet() {
        if (this.getConfigValue('feature.info.extended.hoursUntilDustBagEmptyReminderFlagIsSet')) {
            return Number(this.getConfigValue('feature.info.extended.hoursUntilDustBagEmptyReminderFlagIsSet'));
        }
        return 0;
    }

    getCurrentDateAndTimeFormatted() {
        return helper.getCurrentDateAndTimeFormatted(this);
    }

    setHistoryValuesForDustboxRemoval(ctx) {
        ctx.adapterProxy.setStateConditional('history.timestampOfLastTimeDustboxRemoved', helper.getUnixTimestamp(), true);
        ctx.adapterProxy.setStateConditional('history.dateOfLastTimeDustboxRemoved', this.getCurrentDateAndTimeFormatted(), true);
        ctx.adapterProxy.setStateConditional('history.cleaningTimeSinceLastDustboxRemoved', 0, true);
        ctx.adapterProxy.setStateConditional('history.cleaningTimeSinceLastDustboxRemovedString', helper.getTimeStringFormatted(0), true);
        ctx.adapterProxy.setStateConditional('history.squareMetersSinceLastDustboxRemoved', 0, true);
        ctx.adapterProxy.setStateConditional('info.extended.dustBagEmptyReminder', false, true);
    }

    downloadLastCleaningMapImage(ctx, imageUrl, configValue) {
        const axios = require('axios').default;
        const crypto = require('crypto');
        (async () => {
            let filename = 'lastestCleaningMapImage.png';
            let headers = {};
            if (ctx.getModel().isModelTypeT9Based()) {
                const sign = crypto.createHash('sha256').update(ctx.vacbot.getCryptoHashStringForSecuredContent()).digest('hex');
                headers = {
                    'Authorization': 'Bearer ' + ctx.vacbot.user_access_token,
                    'token': ctx.vacbot.user_access_token,
                    'appid': 'ecovacs',
                    'plat': 'android',
                    'userid': ctx.vacbot.uid,
                    'user-agent': 'EcovacsHome/2.3.7 (Linux; U; Android 5.1.1; A5010 Build/LMY48Z)',
                    'v': '2.3.7',
                    'country': ctx.vacbot.country,
                    'sign': sign,
                    'signType': 'sha256'
                };
            }
            const keepAllFiles = (configValue === 1);
            if (keepAllFiles) {
                const searchElement = ctx.getModel().isModelTypeT9Based() ? '=' : '/';
                const imageId = imageUrl.substring(imageUrl.lastIndexOf(searchElement) + 1);
                filename = `lastCleaningMapImage_${imageId}.png`;
            }
            try {
                const fileExists = await this.fileExistsAsync(this.namespace, filename);
                if (!keepAllFiles || !fileExists) {
                    const res = await axios.get(imageUrl, {
                        headers, responseType: 'arraybuffer'
                    });
                    await this.writeFileAsync(this.namespace, filename, res.data);
                    await ctx.adapterProxy.createObjectNotExists(
                        'cleaninglog.lastCleaningMapImageFile', 'Name of the png file', 'string', 'value', false, '', '');
                    const filePath = '/' + this.namespace + '/' + filename;
                    await ctx.adapterProxy.setStateConditionalAsync(
                        'cleaninglog.lastCleaningMapImageFile', filePath, true);
                } else if (fileExists) {
                    this.log.debug(`File ${filename} already exists`);
                }
            } catch (e) {
                this.log.error(`Error downloading last cleaning map image: ${e}`);
            }
        })();
    }

    async handleChangedCurrentSpotAreaID(ctx, spotAreaID) {
        const spotAreaChannel = 'map.' + ctx.currentMapID + '.spotAreas.' + spotAreaID;
        await this.setCurrentSpotAreaName(ctx, spotAreaID);
        if (ctx.getDevice().isCleaning()) {
            const timestamp = helper.getUnixTimestamp();
            ctx.currentSpotAreaData = {
                'spotAreaID': spotAreaID,
                'lastTimeEnteredTimestamp': timestamp
            };
            await this.handleCleanSpeedForSpotArea(ctx, spotAreaID);
            await this.handleWaterLevelForSpotArea(ctx, spotAreaID);
            await this.handleEnteringSpotArea(ctx, spotAreaID);
            await this.handleLeavingSpotArea(ctx, spotAreaID);
            ctx.adapterProxy.setStateConditional(spotAreaChannel + '.lastTimeEnteredTimestamp', timestamp, true);
            this.log.info(`Entering '${ctx.currentSpotAreaName}' (spotAreaID: ${spotAreaID}, cleanStatus: '${ctx.cleanstatus})'`);
        } else {
            this.handleSilentApproach(ctx);
        }
    }

    async handleEnteringSpotArea(ctx, spotAreaID) {
        if (ctx.currentSpotAreaID && ctx.pauseWhenEnteringSpotArea) {
            if (parseInt(ctx.pauseWhenEnteringSpotArea) === parseInt(spotAreaID)) {
                if (ctx.getDevice().isNotPaused() && ctx.getDevice().isNotStopped()) {
                    ctx.commandQueue.run('pause');
                }
                ctx.pauseWhenEnteringSpotArea = '';
                ctx.adapterProxy.setStateConditional('control.extended.pauseWhenEnteringSpotArea', '', true);
            }
        }
    }

    async handleLeavingSpotArea(ctx, spotAreaID) {
        if (ctx.currentSpotAreaID) {
            if (parseInt(spotAreaID) !== parseInt(ctx.currentSpotAreaID)) {
                if (ctx.pauseWhenLeavingSpotArea) {
                    if (parseInt(ctx.pauseWhenLeavingSpotArea) === parseInt(ctx.currentSpotAreaID)) {
                        if (ctx.getDevice().isNotPaused() && ctx.getDevice().isNotStopped()) {
                            ctx.commandQueue.run('pause');
                        }
                        ctx.pauseWhenLeavingSpotArea = '';
                        ctx.adapterProxy.setStateConditional('control.extended.pauseWhenLeavingSpotArea', '', true);
                    }
                }
            }
        }
    }

    async setCurrentSpotAreaName(ctx, spotAreaID) {
        const state = await ctx.adapterProxy.getStateAsync('map.' + ctx.currentMapID + '.spotAreas.' + spotAreaID + '.spotAreaName');
        if (state && state.val) {
            const spotAreaName = state.val.toString();
            ctx.currentSpotAreaName = mapHelper.getAreaName_i18n(this, ctx, spotAreaName);
        } else {
            ctx.currentSpotAreaName = '';
        }
        ctx.adapterProxy.setStateConditional('map.deebotPositionCurrentSpotAreaName', ctx.currentSpotAreaName, true);
    }

    async handleCleanSpeedForSpotArea(ctx, spotAreaID) {
        const spotAreaChannel = 'map.' + ctx.currentMapID + '.spotAreas.' + spotAreaID;
        const spotAreaState = await ctx.adapterProxy.getStateAsync(spotAreaChannel + '.cleanSpeed');
        if (spotAreaState && spotAreaState.val && (Number(spotAreaState.val) > 0) && (spotAreaState.val !== ctx.cleanSpeed)) {
            ctx.cleanSpeed = spotAreaState.val;
            ctx.adapterProxy.setStateConditional('control.cleanSpeed', ctx.cleanSpeed, false);
            this.log.info('Set clean speed to ' + ctx.cleanSpeed + ' for spot area ' + spotAreaID);
        } else {
            const standardState = await ctx.adapterProxy.getStateAsync('control.cleanSpeed_standard');
            if (standardState && standardState.val && (Number(standardState.val) > 0) && (standardState.val !== ctx.cleanSpeed)) {
                ctx.cleanSpeed = standardState.val;
                ctx.adapterProxy.setStateConditional('control.cleanSpeed', ctx.cleanSpeed, false);
                this.log.info('Set clean speed to standard (' + ctx.cleanSpeed + ') for spot area ' + spotAreaID);
            }
        }
    }

    async handleWaterLevelForSpotArea(ctx, spotAreaID) {
        const spotAreaChannel = 'map.' + ctx.currentMapID + '.spotAreas.' + spotAreaID;
        if (ctx.waterboxInstalled) {
            const spotAreaState = await ctx.adapterProxy.getStateAsync(spotAreaChannel + '.waterLevel');
            if (spotAreaState && spotAreaState.val && (Number(spotAreaState.val) > 0) && (spotAreaState.val !== ctx.waterLevel)) {
                ctx.waterLevel = spotAreaState.val;
                ctx.adapterProxy.setStateConditional('control.waterLevel', ctx.waterLevel, false);
                this.log.info('Set water level to ' + ctx.waterLevel + ' for spot area ' + spotAreaID);
            } else {
                const standardState = await ctx.adapterProxy.getStateAsync('control.waterLevel_standard');
                if (standardState && standardState.val && (Number(standardState.val) > 0) && (standardState.val !== ctx.waterLevel)) {
                    ctx.waterLevel = standardState.val;
                    ctx.adapterProxy.setStateConditional('control.waterLevel', ctx.waterLevel, false);
                    this.log.info('Set water level to standard (' + ctx.waterLevel + ') for spot area ' + spotAreaID);
                }
            }
        }
    }

    handleSilentApproach(ctx) {
        if (ctx.silentApproach.mapSpotAreaID) {
            if ((Number(ctx.silentApproach.mapID) === Number(ctx.currentMapID)) &&
                (Number(ctx.silentApproach.mapSpotAreaID) === Number(ctx.currentSpotAreaID))) {
                if (ctx.silentApproach.mapSpotAreas && ctx.silentApproach.mapSpotAreas !== '') {
                    this.log.info(`Handle silent approach for 'spotArea_silentApproach'`);
                    this.log.info(`Reached spot area '${ctx.silentApproach.mapSpotAreaID}' - start cleaning spot areas '${ctx.silentApproach.mapSpotAreas}' now`);
                    adapterCommands.startSpotAreaCleaning(this, ctx, ctx.silentApproach.mapSpotAreas);
                } else {
                    this.log.info(`Handle silent approach for 'cleanSpotArea_silentApproach'`);
                    this.log.info(`Reached spot area '${ctx.silentApproach.mapSpotAreaID}' - start cleaning now`);
                    adapterCommands.cleanSpotArea(this, ctx, ctx.silentApproach.mapID, ctx.silentApproach.mapSpotAreaID);
                }
                ctx.silentApproach = {};
            } else {
                this.log.debug(`Handle silent approach, but spot area '${ctx.silentApproach.mapSpotAreaID}' not reached yet ...`);
            }
        }
    }

    async handlePositionObj(ctx, obj) {
        ctx.deebotPosition = obj.coords;
        const x = Number(obj.x);
        const y = Number(obj.y);
        const spotAreaID = obj.spotAreaID;
        this.log.silly('DeebotPositionCurrentSpotAreaID: ' + spotAreaID);
        if ((spotAreaID !== 'unknown') && (spotAreaID !== 'void')) {
            const spotAreaHasChanged =
                (ctx.currentSpotAreaData.spotAreaID !== spotAreaID) ||
                (ctx.currentSpotAreaID !== spotAreaID);
            ctx.currentSpotAreaID = spotAreaID;
            if (spotAreaHasChanged) {
                await this.handleChangedCurrentSpotAreaID(ctx, spotAreaID);
            }
            ctx.adapterProxy.setStateConditional('map.deebotPositionCurrentSpotAreaID', spotAreaID, true);
        } else if (ctx.getDevice().isCleaning()) {
            this.log.debug('DeebotPositionCurrentSpotAreaID: spotAreaID is unknown');
        }
        ctx.adapterProxy.setStateConditional('map.deebotPosition', ctx.deebotPosition, true);
        ctx.adapterProxy.setStateConditional('map.deebotPosition_x', x, true);
        ctx.adapterProxy.setStateConditional('map.deebotPosition_y', y, true);
        if (obj.a) {
            const angle = Number(obj.a);
            ctx.adapterProxy.setStateConditional('map.deebotPosition_angle', angle, true);
        }
        ctx.deebotPositionIsInvalid = obj.invalid;
        ctx.adapterProxy.setStateConditional('map.deebotPositionIsInvalid', ctx.deebotPositionIsInvalid, true);
        ctx.adapterProxy.setStateConditional('map.deebotDistanceToChargePosition', obj.distanceToChargingStation, true);
        if (ctx.goToPositionArea) {
            if (mapHelper.positionIsInAreaValueString(x, y, ctx.goToPositionArea)) {
                ctx.vacbot.run('stop');
                this.clearGoToPosition(ctx);
            }
        }
        const pauseBeforeDockingIfWaterboxInstalled = ctx.pauseBeforeDockingIfWaterboxInstalled && ctx.waterboxInstalled;
        if (ctx.getDevice().isReturning() && (ctx.pauseBeforeDockingChargingStation || pauseBeforeDockingIfWaterboxInstalled)) {
            const areaSize = this.getPauseBeforeDockingChargingStationAreaSize();
            if (mapHelper.positionIsInRectangleForPosition(x, y, ctx.chargePosition, areaSize)) {
                if (ctx.getDevice().isNotPaused() && ctx.getDevice().isNotStopped()) {
                    ctx.commandQueue.run(this.getPauseBeforeDockingSendPauseOrStop());
                }
                ctx.adapterProxy.setStateConditional('control.extended.pauseBeforeDockingChargingStation', false, true);
                ctx.pauseBeforeDockingChargingStation = false;
                ctx.pauseBeforeDockingIfWaterboxInstalled = false;
            }
        }
        await this.handleIsCurrentSpotAreaPartOfCleaningProcess(ctx);
    }

    async handleIsCurrentSpotAreaPartOfCleaningProcess(ctx) {
        if ((ctx.currentSpotAreaData.spotAreaID === ctx.currentSpotAreaID) && (ctx.currentSpotAreaData.lastTimeEnteredTimestamp > 0)) {
            const isCurrentSpotAreaPartOfCleaningProcess = await this.isCurrentSpotAreaPartOfCleaningProcess(ctx);
            if (isCurrentSpotAreaPartOfCleaningProcess) {
                await this.handleDurationForLastTimePresence(ctx);
            }
        }
    }

    async handleDurationForLastTimePresence(ctx) {
        const duration = helper.getUnixTimestamp() - ctx.currentSpotAreaData.lastTimeEnteredTimestamp;
        const lastTimePresenceThreshold = this.getConfigValue('feature.map.spotAreas.lastTimePresence.threshold') || 20;
        if (duration >= lastTimePresenceThreshold) {
            await mapObjects.createOrUpdateLastTimePresenceAndLastCleanedSpotArea(this, ctx, duration);
        }
    }

    async createInfoExtendedChannelNotExists(ctx) {
        return ctx.adapterProxy.createChannelNotExists('info.extended', 'Extended information');
    }

    async handleSweepMode(ctx, value) {
        const options = {
            0: 'standard',
            1: 'deep'
        };
        if (ctx.getModel().isModelTypeT20() || ctx.getModel().isModelTypeX2()) {
            Object.assign(options, {
                2: 'fast'
            });
        }
        if (options[value] !== undefined) {
            await this.createInfoExtendedChannelNotExists(ctx);
            await ctx.adapterProxy.createObjectNotExists(
                'info.extended.moppingMode', 'Mopping mode',
                'string', 'value', false, '', '');
            await ctx.adapterProxy.setStateConditionalAsync('info.extended.moppingMode', options[value], true);
            await adapterObjects.createControlSweepModeIfNotExists(this, ctx, options).then(() => {
                ctx.adapterProxy.setStateConditional('control.extended.moppingMode', value, true);
            });
            // Delete previously used states
            await ctx.adapterProxy.deleteObjectIfExists('info.extended.sweepMode');
            await ctx.adapterProxy.deleteObjectIfExists('control.extended.sweepMode');
            await ctx.adapterProxy.deleteObjectIfExists('info.waterbox_moppingType');
            await ctx.adapterProxy.deleteObjectIfExists('info.waterbox_scrubbingPattern');
            await ctx.adapterProxy.deleteObjectIfExists('control.extended.scrubbingPattern');
        } else {
            this.log.warn(`Sweep mode (Mopping mode) with the value ${value} is currently unknown`);
        }
    }

    async handleWaterBoxMoppingType(ctx, value) {
        if (ctx.getModel().isModelTypeAirbot()) return;
        const options = {
            1: 'standard',
            2: 'scrubbing'
        };
        ctx.moppingType = 'waterbox not installed';
        if (options[value] !== undefined) {
            ctx.moppingType = options[value];
            await ctx.adapterProxy.createObjectNotExists(
                'info.waterbox_moppingType', 'Mopping type (OZMO Pro)',
                'string', 'value', false, ctx.moppingType, '');
        }
        if (await ctx.adapterProxy.objectExists('info.waterbox_moppingType')) {
            ctx.adapterProxy.setStateConditional('info.waterbox_moppingType', ctx.moppingType, true);
        }
    }

    async handleWaterBoxScrubbingType(ctx, value) {
        const options = {
            1: 'quick scrubbing',
            2: 'deep scrubbing'
        };
        if (options[value] !== undefined) {
            if (ctx.moppingType === 'scrubbing') {
                await ctx.adapterProxy.createObjectNotExists(
                    'info.waterbox_scrubbingPattern', 'Scrubbing pattern (OZMO Pro)',
                    'string', 'value', false, '', '');
            }
            if (await ctx.adapterProxy.objectExists('info.waterbox_scrubbingPattern')) {
                ctx.adapterProxy.setStateConditional('info.waterbox_scrubbingPattern', options[value], true);
                adapterObjects.createControlScrubbingPatternIfNotExists(this, ctx, options).then(() => {
                    ctx.adapterProxy.setStateConditional('control.extended.scrubbingPattern', value, true);
                });
            }
        } else {
            this.log.warn(`Scrubbing pattern with the value ${value} is currently unknown`);
        }
    }

    handleAirDryingActive(ctx, isAirDrying) {
        this.createAirDryingStates(ctx).then(async () => {
            const state = await ctx.adapterProxy.getStateAsync('info.extended.airDryingActive');
            const timestamp = helper.getUnixTimestamp();
            if (state) {
                ctx.adapterProxy.createChannelNotExists('info.extended.airDryingDateTime',
                    'Air drying process related timestamps').then(() => {
                    let lastEndTimestamp = 0;
                    if (state.val !== isAirDrying) {
                        if ((state.val === false) && (isAirDrying === true)) {
                            ctx.airDryingStartTimestamp = timestamp;
                            ctx.adapterProxy.createObjectNotExists(
                                'info.extended.airDryingDateTime.startTimestamp', 'Start timestamp of the air drying process',
                                'number', 'value', false, 0, '').then(() => {
                                ctx.adapterProxy.setStateConditional('info.extended.airDryingDateTime.startTimestamp', timestamp, true);
                                if (!ctx.airDryingActiveInterval) {
                                    this.setAirDryingActiveTime(ctx).then(() => {
                                        ctx.airDryingActiveInterval = setInterval(() => {
                                            (async () => {
                                                await this.setAirDryingActiveTime(ctx);
                                            })();
                                        }, C.AIR_DRYING_INTERVAL_MS);
                                        this.log.debug('Set airDryingActiveInterval');
                                    });
                                }
                            });
                            ctx.adapterProxy.createObjectNotExists(
                                'info.extended.airDryingDateTime.endTimestamp', 'End timestamp of the air drying process',
                                'number', 'value', false, 0, '').then(() => {
                                ctx.adapterProxy.setStateConditional('info.extended.airDryingDateTime.endTimestamp', 0, true);
                            });
                        } else {
                            lastEndTimestamp = timestamp;
                            ctx.adapterProxy.setStateConditional('info.extended.airDryingDateTime.endTimestamp', timestamp, true);
                            this.setAirDryingActiveTime(ctx).then(() => {
                                if (ctx.airDryingActiveInterval) {
                                    clearInterval(ctx.airDryingActiveInterval);
                                    ctx.airDryingActiveInterval = null;
                                    this.log.debug('Clear airDryingActiveInterval');
                                }
                                setTimeout(() => {
                                    ctx.adapterProxy.setStateConditional('info.extended.airDryingActiveTime', 0, true);
                                    ctx.adapterProxy.setStateConditional('info.extended.airDryingRemainingTime', 0, true);
                                    ctx.adapterProxy.setStateConditional('info.extended.airDryingDateTime.startTimestamp', 0, true);
                                    ctx.adapterProxy.setStateConditional('info.extended.airDryingDateTime.endTimestamp', 0, true);
                                    ctx.airDryingStartTimestamp = 0;
                                    this.log.debug('Reset air drying active time and timestamp states after 60 seconds');
                                }, C.AIR_DRYING_RESET_DELAY_MS);
                            });
                            this.log.info(`Air drying process finished`);
                        }
                    }
                    ctx.adapterProxy.setStateConditional('info.extended.airDryingActive', isAirDrying, true);
                    const lastStartTimestamp = ctx.airDryingStartTimestamp;
                    if (lastStartTimestamp > 0) {
                        const startDateTime = this.formatDate(lastStartTimestamp, 'TT.MM.JJJJ SS:mm:ss');
                        ctx.adapterProxy.createObjectNotExists(
                            'info.extended.airDryingDateTime.startDateTime', 'Start date and time of the air drying process',
                            'string', 'value', false, '', '').then(() => {
                            ctx.adapterProxy.setStateConditional('info.extended.airDryingDateTime.startDateTime', startDateTime, true);
                        });
                        ctx.adapterProxy.createObjectNotExists(
                            'info.extended.airDryingDateTime.endDateTime', 'End date and time of the air drying process',
                            'string', 'value', false, '', '').then(() => {
                            ctx.adapterProxy.setStateConditional('info.extended.airDryingDateTime.endDateTime', '', true);
                        });
                        this.log.info(`Air drying process started`);
                    }
                    if (lastEndTimestamp > 0) {
                        const endDateTime = this.formatDate(lastEndTimestamp, 'TT.MM.JJJJ SS:mm:ss');
                        ctx.adapterProxy.setStateConditional('info.extended.airDryingDateTime.endDateTime', endDateTime, true);
                    }
                });
            }
        });
    }

    async createAirDryingStates(ctx) {
        let states = {
            120: '120',
            180: '180',
            240: '240'
        };
        let def = 120;
        if (ctx.getModel().isModelTypeX1()) {
            // @ts-ignore
            states = {
                150: '150',
                210: '210'
            };
            def = 150;
        }
        await ctx.adapterProxy.setObjectNotExistsAsync('control.extended.airDryingDuration', {
            'type': 'state',
            'common': {
                'name': 'Duration of the air drying process in minutes',
                'type': 'number',
                'role': 'level',
                'read': true,
                'write': true,
                'min': 120,
                'max': 240,
                'def': def,
                'unit': 'min',
                'states': states
            },
            'native': {}
        });
        await ctx.adapterProxy.createObjectNotExists(
            'info.extended.airDryingActive', 'Indicates whether the air drying process is active',
            'boolean', 'value', false, false, '');
        await ctx.adapterProxy.createObjectNotExists(
            'info.extended.airDryingActiveTime', 'Active time (duration) of the air drying process',
            'number', 'value', false, 0, 'min');
        await ctx.adapterProxy.createObjectNotExists(
            'info.extended.airDryingRemainingTime', 'Remaining time (duration) of the air drying process',
            'number', 'value', false, 0, 'min');
    }

    async setAirDryingActiveTime(ctx) {
        if (ctx.airDryingStartTimestamp > 0) {
            const timestamp = helper.getUnixTimestamp();
            const activeTime = Math.floor((timestamp - ctx.airDryingStartTimestamp) / 60);
            await this.createAirDryingStates(ctx);
            await ctx.adapterProxy.setStateConditionalAsync('info.extended.airDryingActiveTime', activeTime, true);
            const airDryingDurationState = await ctx.adapterProxy.getStateAsync('control.extended.airDryingDuration');
            if (airDryingDurationState && airDryingDurationState.val) {
                let endTimestamp = ctx.airDryingStartTimestamp + (Number(airDryingDurationState.val) * 60);
                let remainingTime = Number(airDryingDurationState.val) - activeTime;
                // It happened with the X1 Turbo using the value 60 (airDryingDuration) ...
                if (timestamp >= endTimestamp) {
                    endTimestamp = timestamp;
                    remainingTime = 0;
                }
                await ctx.adapterProxy.setStateConditionalAsync('info.extended.airDryingRemainingTime', remainingTime, true);
                await ctx.adapterProxy.setStateConditionalAsync('info.extended.airDryingDateTime.endTimestamp', endTimestamp, true);
                const endDateTime = this.formatDate(endTimestamp, 'TT.MM.JJJJ SS:mm:ss');
                await ctx.adapterProxy.setStateConditionalAsync('info.extended.airDryingDateTime.endDateTime', endDateTime, true);
            }
        }
    }
}

// @ts-ignore parent is a valid property on module
if (module && module.parent) {
    module.exports = (options) => new EcovacsDeebot(options);
} else {
    new EcovacsDeebot();
}














