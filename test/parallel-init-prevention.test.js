'use strict';

/**
 * Tests that protect against the "parallel instantiations causing high load"
 * problem observed after several days of uptime, where a single device's
 * 'ready' event fires repeatedly (due to MQTT auto-reconnect and leaked
 * MQTT clients) and re-runs the entire heavy initialization pipeline each
 * time, flooding the device with command bursts and the log with
 * "successfully initialized" lines.
 *
 * The four protections under test are documented in the analysis preceding
 * the implementation:
 *
 *   A. Idempotent 'ready' handler  - heavy init runs only once per ctx
 *   B. Disconnect-before-reconnect - retry paths must not leak MQTT clients
 *   C. Ready debounce              - rapid duplicate ready emissions are coalesced
 *   D. Tracked init-get-states     - the post-ready setTimeout cannot accumulate
 */

const { expect } = require('chai');
const { describe, it, beforeEach, afterEach } = require('mocha');
const proxyquire = require('proxyquire').noCallThru();
const sinon = require('sinon');

const C = require('../lib/constants');

// ---------------------------------------------------------------------------
// Shared fixtures for the eventHandlers tests (Fix A, C, D)
// ---------------------------------------------------------------------------

function buildEventHandlerFixtures() {
    const main = {
        log: {
            info: sinon.stub(), warn: sinon.stub(), error: sinon.stub(),
            debug: sinon.stub(), silly: sinon.stub()
        },
        version: '2.0.0',
        canvasModuleIsInstalled: false,
        updateDeviceConnectionState: sinon.stub(),
        clearUnreachableRetry: sinon.stub(),
        updateConnectionState: sinon.stub(),
        setConnection: sinon.stub(),
        setInitialStateValues: sinon.stub().resolves(),
        vacbotInitialGetStates: sinon.stub(),
        handleDeviceDataReceived: sinon.stub()
    };

    const ctx = {
        deviceId: 'test_device',
        connected: false,
        connectionFailed: false,
        unreachableRetryCount: 0,
        unreachableWarningSent: false,
        retries: 0,
        api: { getVersion: sinon.stub().returns('0.9.6-beta.12') },
        getModel: sinon.stub().returns({
            getDeviceClass: sinon.stub().returns('p1jij8'),
            getProductName: sinon.stub().returns('Test Bot'),
            getDeviceType: sinon.stub().returns('Vacuum Cleaner'),
            getDeviceCategory: sinon.stub().returns('Vacuum Cleaner'),
            getProtocol: sinon.stub().returns('MQTT'),
            is950type: sinon.stub().returns(true),
            getDeviceCapabilities: sinon.stub().returns({
                type: 'Vacuum Cleaner', hasMapping: false, hasWaterBox: false,
                hasAirDrying: false, hasAutoEmpty: false, hasSpotAreas: false,
                hasVirtualBoundaries: false, hasContinuousCleaning: false,
                hasDoNotDisturb: false, hasVoiceAssistant: false,
                hasCleaningStation: false, hasFloorWashing: false
            }),
            getProductImageURL: sinon.stub().returns('')
        }),
        getModelType: sinon.stub().returns('T20'),
        getPlatformType: sinon.stub().returns('T20'),
        adapterProxy: {
            setStateConditional: sinon.stub(),
            createObjectNotExists: sinon.stub().resolves()
        }
    };

    // Capture the listener that registerReadyEvent registers so we can
    // emit 'ready' on demand from the test.
    let readyHandler = null;
    const vacbot = {
        on: sinon.stub().callsFake((eventName, handler) => {
            if (eventName === 'ready') readyHandler = handler;
        })
    };

    const vacuum = { nick: 'TestBot', did: 'test-did' };

    const adapterObjects = {
        createAdditionalObjects: sinon.stub().resolves(),
        createDeviceCapabilityObjects: sinon.stub().resolves(),
        createStationObjects: sinon.stub().resolves()
    };

    const eventHandlers = proxyquire('../lib/eventHandlers', {
        './adapterObjects': adapterObjects
    });

    return {
        main, ctx, vacbot, vacuum, adapterObjects, eventHandlers,
        emitReady: () => readyHandler && readyHandler()
    };
}

describe('parallel-init-prevention.test.js', () => {

    // -----------------------------------------------------------------------
    // Fix A: idempotent 'ready' handler
    // -----------------------------------------------------------------------
    describe("Fix A - 'ready' handler is idempotent", () => {
        let f;
        let clock;

        beforeEach(() => {
            clock = sinon.useFakeTimers();
            f = buildEventHandlerFixtures();
            f.eventHandlers.registerReadyEvent(f.main, f.vacbot, f.ctx, f.vacuum);
        });

        afterEach(() => {
            clock.restore();
        });

        it('runs the heavy init pipeline exactly once across multiple ready emissions', async () => {
            f.emitReady();
            await Promise.resolve(); await Promise.resolve();
            await clock.tickAsync(0); await clock.tickAsync(0);

            // Simulate 4 more ready emissions arriving over the next minute
            // (e.g. from leaked MQTT clients or library auto-reconnects).
            for (let i = 0; i < 4; i++) {
                await clock.tickAsync(30000);
                f.emitReady();
                await Promise.resolve(); await Promise.resolve();
            }
            await clock.tickAsync(0);

            expect(f.adapterObjects.createAdditionalObjects.callCount,
                'createAdditionalObjects should run only once').to.equal(1);
            expect(f.adapterObjects.createDeviceCapabilityObjects.callCount,
                'createDeviceCapabilityObjects should run only once').to.equal(1);
            expect(f.adapterObjects.createStationObjects.callCount,
                'createStationObjects should run only once').to.equal(1);
            expect(f.main.setInitialStateValues.callCount,
                'setInitialStateValues should run only once').to.equal(1);
        });

        it('logs "successfully initialized" only once per ctx, even after many ready emissions', async () => {
            f.emitReady();
            await Promise.resolve(); await Promise.resolve();
            await clock.tickAsync(0);

            for (let i = 0; i < 5; i++) {
                await clock.tickAsync(30000);
                f.emitReady();
                await Promise.resolve(); await Promise.resolve();
            }

            const initLogCalls = f.main.log.info.getCalls()
                .filter(c => /successfully initialized/.test(String(c.args[0] || '')));
            expect(initLogCalls.length, 'expected exactly one "successfully initialized" log').to.equal(1);

            const libLogCalls = f.main.log.info.getCalls()
                .filter(c => /^Library version:/.test(String(c.args[0] || '')));
            expect(libLogCalls.length, 'expected exactly one "Library version" log').to.equal(1);

            const productLogCalls = f.main.log.info.getCalls()
                .filter(c => /^Product name:/.test(String(c.args[0] || '')));
            expect(productLogCalls.length, 'expected exactly one "Product name" log').to.equal(1);
        });

        it('a second ready arriving while the first heavy init is still running does not start a parallel heavy init', async () => {
            // Review finding #2: there is a race window between the debounce
            // expiring (>READY_DEBOUNCE_MS) and ctx._readyInitDone being set
            // at the very end of the heavy path. We close it with a
            // synchronous "in-progress" flag set at the top of the async
            // IIFE, so a concurrent ready emission cannot kick off a second
            // heavy pipeline.
            //
            // Make createObjectNotExists slow so the first heavy init is
            // still in-flight when the second 'ready' arrives.
            let resolveCreateObj;
            f.ctx.adapterProxy.createObjectNotExists = sinon.stub().returns(
                new Promise((res) => { resolveCreateObj = res; })
            );

            f.emitReady();
            // Give the IIFE a chance to start and reach the slow await.
            for (let i = 0; i < 5; i++) {
                await Promise.resolve();
                await clock.tickAsync(0);
            }
            expect(f.ctx.adapterProxy.createObjectNotExists.callCount,
                'first heavy init reached the slow await').to.equal(1);
            expect(f.ctx._readyInitDone || false,
                'first heavy init has NOT completed yet').to.equal(false);

            // Tick well past the debounce window and emit a second ready.
            await clock.tickAsync(C.READY_DEBOUNCE_MS + 1000);
            f.emitReady();
            for (let i = 0; i < 5; i++) {
                await Promise.resolve();
                await clock.tickAsync(0);
            }

            // The second ready must NOT have triggered another heavy init.
            expect(f.ctx.adapterProxy.createObjectNotExists.callCount,
                'createObjectNotExists must remain at 1 - no concurrent heavy init').to.equal(1);
            expect(f.adapterObjects.createAdditionalObjects.callCount,
                'createAdditionalObjects must remain at 1').to.equal(1);

            // Let the first init finish; everything should still have run only once.
            resolveCreateObj();
            for (let i = 0; i < 10; i++) {
                await Promise.resolve();
                await clock.tickAsync(0);
            }
            expect(f.ctx._readyInitDone, 'first init completes').to.equal(true);
            expect(f.main.setInitialStateValues.callCount,
                'setInitialStateValues must remain at 1').to.equal(1);
        });

        it('still restores connection state on a duplicate ready emission (light path)', async () => {
            // First (full) init.
            f.emitReady();
            await Promise.resolve(); await Promise.resolve();
            await clock.tickAsync(0);

            // Simulate transient disconnect: ctx.connected goes false.
            f.ctx.connected = false;
            f.main.updateDeviceConnectionState.resetHistory();
            f.main.clearUnreachableRetry.resetHistory();

            // Long enough to bypass the ready-debounce (Fix C).
            await clock.tickAsync(30000);

            // Second ready arrives - should NOT redo heavy init but SHOULD
            // re-mark the device as connected.
            f.emitReady();
            await Promise.resolve(); await Promise.resolve();
            await clock.tickAsync(0);

            expect(f.ctx.connected, 'ctx should be marked connected').to.equal(true);
            expect(f.main.updateDeviceConnectionState.calledWith(f.ctx, true),
                'updateDeviceConnectionState(true) should be called').to.equal(true);
            expect(f.main.clearUnreachableRetry.calledWith(f.ctx),
                'clearUnreachableRetry should be called').to.equal(true);

            // ... but the heavy pieces still ran only once.
            expect(f.adapterObjects.createAdditionalObjects.callCount).to.equal(1);
            expect(f.main.setInitialStateValues.callCount).to.equal(1);
        });
    });

    // -----------------------------------------------------------------------
    // Fix C: ready debounce
    // -----------------------------------------------------------------------
    describe('Fix C - ready emissions arriving within READY_DEBOUNCE_MS are coalesced', () => {
        let f;
        let clock;

        beforeEach(() => {
            clock = sinon.useFakeTimers();
            f = buildEventHandlerFixtures();
            f.eventHandlers.registerReadyEvent(f.main, f.vacbot, f.ctx, f.vacuum);
        });

        afterEach(() => {
            clock.restore();
        });

        it('ignores a ready emission that arrives <READY_DEBOUNCE_MS after the previous', async () => {
            // First ready - heavy init.
            f.emitReady();
            // Drain the async heavy-init pipeline (multiple awaits inside).
            for (let i = 0; i < 10; i++) {
                await Promise.resolve();
                await clock.tickAsync(0);
            }
            expect(f.ctx._readyInitDone, 'precondition: heavy init should have completed').to.equal(true);

            f.main.updateDeviceConnectionState.resetHistory();

            // Second ready arrives 100 ms later - should be entirely ignored.
            await clock.tickAsync(100);
            f.emitReady();
            await Promise.resolve(); await Promise.resolve();
            await clock.tickAsync(0);

            expect(f.main.updateDeviceConnectionState.called,
                'inside the debounce window the handler should be a no-op').to.equal(false);
        });

        it('exposes READY_DEBOUNCE_MS via constants', () => {
            expect(C.READY_DEBOUNCE_MS, 'READY_DEBOUNCE_MS must exist in lib/constants.js')
                .to.be.a('number').and.to.be.greaterThan(0);
        });
    });

    // -----------------------------------------------------------------------
    // Fix D: tracked initial-get-states timeout
    // -----------------------------------------------------------------------
    describe('Fix D - vacbotInitialGetStates timer is tracked and cannot accumulate', () => {
        let f;
        let clock;

        beforeEach(() => {
            clock = sinon.useFakeTimers();
            f = buildEventHandlerFixtures();
            f.eventHandlers.registerReadyEvent(f.main, f.vacbot, f.ctx, f.vacuum);
        });

        afterEach(() => {
            clock.restore();
        });

        it('stores the pending setTimeout id on the ctx so it can be cleared on unload', async () => {
            f.emitReady();
            await Promise.resolve(); await Promise.resolve();
            await clock.tickAsync(0);

            expect(f.ctx._initialGetStatesTimeout,
                'expected ctx._initialGetStatesTimeout to be set').to.exist;
        });

        it('does not call vacbotInitialGetStates more than once even when many ready events arrive', async () => {
            f.emitReady();
            await Promise.resolve(); await Promise.resolve();

            // Several spurious ready events while the post-ready timer is pending.
            for (let i = 0; i < 5; i++) {
                await clock.tickAsync(C.READY_DEBOUNCE_MS + 100);
                f.emitReady();
                await Promise.resolve(); await Promise.resolve();
            }

            // Now let the post-ready timer fire.
            await clock.tickAsync(C.INITIAL_GET_COMMANDS_DELAY_MS + 100);

            expect(f.main.vacbotInitialGetStates.callCount,
                'vacbotInitialGetStates should fire only once').to.equal(1);
        });
    });

    // -----------------------------------------------------------------------
    // Fix B: main.js retry paths must disconnect before reconnect
    // -----------------------------------------------------------------------
    describe('Fix B - retry paths in main.js disconnect existing MQTT client before reconnecting', () => {
        let clock;
        let instance;

        const mockEcoVacsAPI = sinon.stub();
        mockEcoVacsAPI.md5 = sinon.stub().returns('mocked-md5');
        mockEcoVacsAPI.getDeviceId = sinon.stub().returns('mocked-device-id');
        mockEcoVacsAPI.REALM = 'mocked-realm';
        mockEcoVacsAPI.isCanvasModuleAvailable = sinon.stub().returns(false);

        const mockEcovacsDeebot = {
            EcoVacsAPI: mockEcoVacsAPI,
            countries: { DE: { continent: 'EU' } }
        };

        const mockAdapterCore = {
            Adapter: class {
                constructor(options) {
                    Object.assign(this, options || {});
                    this.name = 'ecovacs-deebot';
                    this.namespace = 'ecovacs-deebot.0';
                    this.log = {
                        info: sinon.stub(), warn: sinon.stub(), error: sinon.stub(),
                        debug: sinon.stub(), silly: sinon.stub()
                    };
                    this.config = {
                        pollingInterval: 120000, countrycode: 'DE',
                        email: 'a@b', password: 'pw', singleDeviceMode: false
                    };
                    this.password = 'pw';
                    this.deviceContexts = new Map();
                    this.connected = false;
                    this.authFailed = false;
                    this._connecting = false;
                    this._lastConnectTime = 0;
                    this._lastReconnectTime = 0;
                    this._startupTime = 0;
                    this.globalMqttUnreachable = false;
                    this.globalMqttUnreachableTimeout = null;
                    this.globalMqttUnreachableCount = 0;
                    this.globalMqttOfflineWarningSent = false;

                    this.on = sinon.stub();
                    this.setStateConditional = sinon.stub();
                    this.setStateConditionalAsync = sinon.stub().resolves();
                    this.error = sinon.stub();
                    this.setConnection = sinon.stub();
                    this.updateConnectionState = sinon.stub();
                    this.updateDeviceConnectionState = sinon.stub();
                    this.startPolling = sinon.stub();
                    this.stopPolling = sinon.stub();
                    this.clearGoToPosition = sinon.stub();
                    this.isAuthError = sinon.stub().returns(false);
                }
            }
        };

        beforeEach(() => {
            clock = sinon.useFakeTimers();
            sinon.resetHistory();

            const EcovacsDeebotFactory = proxyquire('../main', {
                '@iobroker/adapter-core': mockAdapterCore,
                'ecovacs-deebot': mockEcovacsDeebot,
                'node-machine-id': { machineIdSync: sinon.stub().returns('mid') },
                './lib/adapterObjects': {
                    createInitialInfoObjects: sinon.stub().resolves(),
                    createInitialObjects: sinon.stub().resolves()
                },
                './lib/eventHandlers': {
                    registerReadyEvent: sinon.stub().resolves(),
                    registerChargeStateEvent: sinon.stub(),
                    registerCleanReportEvent: sinon.stub(),
                    registerWaterCleaningEvents: sinon.stub(),
                    registerStationEvents: sinon.stub(),
                    registerMiscEventHandlers: sinon.stub(),
                    registerConsumableEvents: sinon.stub(),
                    registerConnectionEvents: sinon.stub(),
                    registerMapEvents: sinon.stub(),
                    registerAirbotEvents: sinon.stub()
                }
            });
            instance = EcovacsDeebotFactory({});
            // Move past startup grace period so retry/reconnect paths run.
            instance._startupTime = Date.now() - (C.STARTUP_GRACE_PERIOD_MS + 1000);
        });

        afterEach(() => {
            clock.restore();
        });

        function makeCtx(deviceId = 'dev1') {
            const vacbot = {
                connect: sinon.stub(),
                disconnect: sinon.stub().resolves(),
                removeAllListeners: sinon.stub(),
                on: sinon.stub()
            };
            const ctx = {
                deviceId,
                vacbot,
                vacuum: { did: deviceId, nick: 'Bot' },
                connected: false,
                connectionFailed: true,
                unreachableRetryCount: 0,
                unreachableRetryTimeout: null,
                commandFailedCount: 0,
                commandFailedResetTimeout: null,
                getModel: () => ({ getProductName: () => 'Test', isSupportedFeature: () => false, isMappingSupported: () => false })
            };
            instance.deviceContexts.set(deviceId, ctx);
            return ctx;
        }

        it('scheduleUnreachableRetry: disconnects the existing vacbot before calling connect()', async () => {
            const ctx = makeCtx('dev1');

            instance.scheduleUnreachableRetry(ctx);

            // Run scheduled timer (first backoff slot = 30s).
            await clock.tickAsync(C.BACKOFF_SCHEDULE[0] + 100);
            // Allow any pending microtasks (await disconnect()) to flush.
            await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

            expect(ctx.vacbot.disconnect.callCount,
                'disconnect() should be called before reconnect on retry').to.be.greaterThan(0);
            expect(ctx.vacbot.connect.callCount,
                'connect() must be called once on retry').to.equal(1);

            const disconnectOrder = ctx.vacbot.disconnect.firstCall &&
                ctx.vacbot.disconnect.firstCall.calledBefore(ctx.vacbot.connect.firstCall);
            expect(disconnectOrder, 'disconnect() must be called before connect()').to.equal(true);
        });

        it('scheduleGlobalMqttRetry: disconnects each existing vacbot before calling connect()', async () => {
            const ctxA = makeCtx('devA');
            const ctxB = makeCtx('devB');

            instance.globalMqttUnreachable = true;
            instance.scheduleGlobalMqttRetry();

            await clock.tickAsync(C.BACKOFF_SCHEDULE[0] + 100);
            await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

            for (const ctx of [ctxA, ctxB]) {
                expect(ctx.vacbot.disconnect.callCount,
                    `disconnect should be called for ${ctx.deviceId} before reconnect`).to.be.greaterThan(0);
                expect(ctx.vacbot.connect.callCount,
                    `connect should be called once for ${ctx.deviceId}`).to.equal(1);
                expect(ctx.vacbot.disconnect.firstCall.calledBefore(ctx.vacbot.connect.firstCall),
                    `disconnect must precede connect for ${ctx.deviceId}`).to.equal(true);
            }
        });

        it('a thrown/rejected disconnect() does not prevent reconnect from being attempted', async () => {
            const ctx = makeCtx('dev1');
            ctx.vacbot.disconnect = sinon.stub().rejects(new Error('boom'));

            instance.scheduleUnreachableRetry(ctx);

            await clock.tickAsync(C.BACKOFF_SCHEDULE[0] + 100);
            await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

            expect(ctx.vacbot.connect.callCount,
                'connect() must still be attempted even when disconnect() rejects').to.equal(1);
        });

        it('scheduleGlobalMqttRetry: one device throwing on connect() must not abort the loop for the rest', async () => {
            // Review finding #1: the original loop wrapped each device in
            // its own try/catch so a single sync failure could not skip the
            // remaining devices. The refactored loop must preserve that
            // per-device error containment.
            const ctxA = makeCtx('devA');
            const ctxB = makeCtx('devB');
            const ctxC = makeCtx('devC');
            ctxB.vacbot.connect = sinon.stub().throws(new Error('connect blew up for B'));

            instance.globalMqttUnreachable = true;
            instance.scheduleGlobalMqttRetry();

            await clock.tickAsync(C.BACKOFF_SCHEDULE[0] + 100);
            await Promise.resolve(); await Promise.resolve(); await Promise.resolve();

            expect(ctxA.vacbot.connect.callCount,
                'devA connect() should run').to.equal(1);
            expect(ctxB.vacbot.connect.callCount,
                'devB connect() was attempted (before throwing)').to.equal(1);
            expect(ctxC.vacbot.connect.callCount,
                'devC connect() must still run after devB threw').to.equal(1);
        });
    });

    // -----------------------------------------------------------------------
    // Fix D (cleanup side): main.js cleanup paths must clear the timer.
    // -----------------------------------------------------------------------
    describe('Fix D - main.js cleanup clears ctx._initialGetStatesTimeout', () => {
        let clock;
        let instance;

        const mockEcoVacsAPI = sinon.stub();
        mockEcoVacsAPI.md5 = sinon.stub().returns('mocked-md5');
        mockEcoVacsAPI.getDeviceId = sinon.stub().returns('mocked-device-id');
        mockEcoVacsAPI.REALM = 'mocked-realm';
        mockEcoVacsAPI.isCanvasModuleAvailable = sinon.stub().returns(false);

        const mockEcovacsDeebot = {
            EcoVacsAPI: mockEcoVacsAPI,
            countries: { DE: { continent: 'EU' } }
        };

        const mockAdapterCore = {
            Adapter: class {
                constructor(options) {
                    Object.assign(this, options || {});
                    this.name = 'ecovacs-deebot';
                    this.namespace = 'ecovacs-deebot.0';
                    this.log = {
                        info: sinon.stub(), warn: sinon.stub(), error: sinon.stub(),
                        debug: sinon.stub(), silly: sinon.stub()
                    };
                    this.config = { pollingInterval: 120000, countrycode: 'DE', email: 'a@b', password: 'pw' };
                    this.password = 'pw';
                    this.deviceContexts = new Map();
                    this._connecting = false;
                    this._lastConnectTime = 0;
                    this._lastReconnectTime = 0;
                    this._startupTime = 0;
                    this.globalMqttUnreachable = false;
                    this.globalMqttUnreachableTimeout = null;

                    this.on = sinon.stub();
                    this.setStateConditional = sinon.stub();
                    this.setConnection = sinon.stub();
                    this.updateConnectionState = sinon.stub();
                    this.updateDeviceConnectionState = sinon.stub();
                    this.stopPolling = sinon.stub();
                    this.startPolling = sinon.stub();
                    this.clearGoToPosition = sinon.stub();
                    this.isAuthError = sinon.stub().returns(false);
                    this.error = sinon.stub();
                }
            }
        };

        beforeEach(() => {
            clock = sinon.useFakeTimers();
            sinon.resetHistory();

            const EcovacsDeebotFactory = proxyquire('../main', {
                '@iobroker/adapter-core': mockAdapterCore,
                'ecovacs-deebot': mockEcovacsDeebot,
                'node-machine-id': { machineIdSync: sinon.stub().returns('mid') },
                './lib/adapterObjects': {
                    createInitialInfoObjects: sinon.stub().resolves(),
                    createInitialObjects: sinon.stub().resolves()
                },
                './lib/eventHandlers': {
                    registerReadyEvent: sinon.stub().resolves(),
                    registerChargeStateEvent: sinon.stub(),
                    registerCleanReportEvent: sinon.stub(),
                    registerWaterCleaningEvents: sinon.stub(),
                    registerStationEvents: sinon.stub(),
                    registerMiscEventHandlers: sinon.stub(),
                    registerConsumableEvents: sinon.stub(),
                    registerConnectionEvents: sinon.stub(),
                    registerMapEvents: sinon.stub(),
                    registerAirbotEvents: sinon.stub()
                }
            });
            instance = EcovacsDeebotFactory({});
        });

        afterEach(() => {
            clock.restore();
        });

        it('onUnload clears ctx._initialGetStatesTimeout if set', () => {
            const fakeTimer = setTimeout(() => {}, 60000);
            const ctx = {
                vacbot: { disconnect: sinon.stub(), removeAllListeners: sinon.stub() },
                _initialGetStatesTimeout: fakeTimer
            };
            instance.deviceContexts.set('dev', ctx);
            instance.onUnload(() => {});

            expect(ctx._initialGetStatesTimeout,
                'unload should null out the tracked timer').to.equal(null);
        });

        it('reconnect() clears ctx._initialGetStatesTimeout if set', () => {
            const fakeTimer = setTimeout(() => {}, 60000);
            const ctx = {
                vacbot: { disconnect: sinon.stub(), removeAllListeners: sinon.stub() },
                _initialGetStatesTimeout: fakeTimer,
                retries: 0
            };
            instance.deviceContexts.set('dev', ctx);
            // reconnect() clears deviceContexts; we just need the timer to be cleared first.
            instance._startupTime = Date.now() - (C.STARTUP_GRACE_PERIOD_MS + 1000);
            instance.reconnect();

            // After reconnect the ctx is removed from the map, but we kept a
            // reference; the timer must have been cleared on it.
            expect(ctx._initialGetStatesTimeout,
                'reconnect should null out the tracked timer').to.equal(null);
        });
    });
});
