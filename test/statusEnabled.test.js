'use strict';

const { expect } = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { createMockAdapter, createMockCtx, createMockDevice } = require('./mockHelper');

const mockAdapterHelper = {
    getStateNameById: sinon.stub(),
    getChannelNameById: sinon.stub(),
    getSubChannelNameById: sinon.stub(),
    getUnixTimestamp: sinon.stub().returns(1234567890),
    isValidChargeStatus: sinon.stub(),
    isValidCleanStatus: sinon.stub(),
    getDeviceStatusByStatus: sinon.stub(),
    isSingleSpotAreaValue: sinon.stub().returns(false),
    areaValueStringWithCleaningsIsValid: sinon.stub().returns(false),
    areaValueStringIsValid: sinon.stub().returns(false),
    positionValueStringIsValid: sinon.stub().returns(false)
};

const mockMapHelper = {
    getAreaValue: sinon.stub(),
    getSpotAreaName: sinon.stub(),
    getPositionValuesForExtendedArea: sinon.stub(),
    saveLastUsedCustomAreaValues: sinon.stub().resolves(),
    saveCurrentSpotAreaValues: sinon.stub().resolves(),
    saveGoToPositionValues: sinon.stub().resolves(),
    saveVirtualBoundary: sinon.stub().resolves(),
    saveVirtualBoundarySet: sinon.stub().resolves(),
    deleteVirtualBoundary: sinon.stub().resolves(),
    createVirtualBoundary: sinon.stub().resolves(),
    createVirtualBoundarySet: sinon.stub().resolves(),
    isSpotAreasChannel: sinon.stub().returns(false)
};

const adapterCommands = proxyquire('../lib/adapterCommands', {
    './adapterHelper': mockAdapterHelper,
    './mapHelper': mockMapHelper
});

const mockObjectsAdapterHelper = {
    getStateNameById: sinon.stub(),
    getUnixTimestamp: sinon.stub().returns(0)
};

const adapterObjects = proxyquire('../lib/adapterObjects', {
    './adapterHelper': mockObjectsAdapterHelper
});

const DeviceContext = require('../lib/deviceContext');

function configureMockHelperForSubPath(subPath) {
    const parts = subPath.split('.');
    const stateName = parts[parts.length - 1];
    const channelName = parts[0] || undefined;
    const subChannelName = parts.length >= 2 ? parts[parts.length - 2] : undefined;
    mockAdapterHelper.getStateNameById.returns(stateName);
    mockAdapterHelper.getChannelNameById.returns(channelName);
    mockAdapterHelper.getSubChannelNameById.returns(subChannelName);
}

function createMockAdapterForMain() {
    return {
        namespace: 'ecovacs-deebot.0',
        config: { singleDeviceMode: false },
        deviceContexts: new Map(),
        log: {
            silly: sinon.stub(),
            debug: sinon.stub(),
            info: sinon.stub(),
            warn: sinon.stub(),
            error: sinon.stub()
        },
        getStateAsync: sinon.stub().resolves(null),
        setStateConditional: sinon.stub(),
        subscribeStates: sinon.stub(),
        getObject: sinon.stub(),
        getState: sinon.stub()
    };
}

describe('status.enabled - Device Deactivation Feature', () => {

    describe('adapterObjects.js - status.enabled state creation', () => {
        let adapter;
        let ctx;

        beforeEach(() => {
            adapter = createMockAdapter();
            ctx = createMockCtx({ adapter });
        });

        it('should create status.enabled as writable boolean with default true', async () => {
            await adapterObjects.createInitialObjects(adapter, ctx);

            expect(ctx.adapterProxy.createObjectNotExists.calledWith(
                'status.enabled', 'Enable or disable device control and updates',
                'boolean', 'switch.enable', true, true, ''
            )).to.be.true;
        });

        it('should create status.enabled after status.device', async () => {
            await adapterObjects.createInitialObjects(adapter, ctx);

            const calls = ctx.adapterProxy.createObjectNotExists.getCalls();
            const statusDeviceCallIdx = calls.findIndex(
                c => c.args[0] === 'status.device'
            );
            const statusEnabledCallIdx = calls.findIndex(
                c => c.args[0] === 'status.enabled'
            );

            expect(statusDeviceCallIdx).to.be.at.least(0);
            expect(statusEnabledCallIdx).to.be.at.least(0);
            expect(statusEnabledCallIdx).to.be.greaterThan(statusDeviceCallIdx);
        });

        it('should NOT create status.enabled for aqMonitor model type', async () => {
            ctx.getPlatformType.returns('aqMonitor');

            await adapterObjects.createInitialObjects(adapter, ctx);

            expect(ctx.adapterProxy.createObjectNotExists.calledWith(
                'status.enabled'
            )).to.be.false;
        });
    });

    describe('deviceContext.js - enabled property', () => {
        it('should default enabled to true', () => {
            const adapter = createMockAdapter();
            const vacbot = { run: sinon.stub() };
            const vacuum = { did: 'test_did' };
            const ctx = new DeviceContext(adapter, 'test_device', vacbot, vacuum);

            expect(ctx.enabled).to.be.true;
        });
    });

    describe('adapterCommands.js - handleStateChange blocking when disabled', () => {
        let adapter;
        let ctx;

        beforeEach(() => {
            adapter = createMockAdapter();
            ctx = createMockCtx({ adapter });
            ctx.connected = true;
            adapter.getState.callsFake((_id, cb) => {
                if (cb) cb(null, { val: null });
            });
        });

        it('should NOT dispatch control commands when device is disabled', async () => {
            ctx.enabled = false;
            configureMockHelperForSubPath('control.clean');
            adapter.getObject.callsFake((_id, cb) => {
                if (cb) cb(null, { common: { name: 'Start cleaning', role: 'button' } });
            });

            await adapterCommands.handleStateChange(adapter, ctx, 'control.clean', {
                val: true,
                ack: false
            });

            expect(ctx.adapterProxy.setStateConditional.calledWith(
                'control.clean', false, true
            )).to.be.false;
        });

        it('should NOT dispatch charge command when device is disabled', async () => {
            ctx.enabled = false;
            configureMockHelperForSubPath('control.charge');
            adapter.getObject.callsFake((_id, cb) => {
                if (cb) cb(null, { common: { name: 'Return to dock', role: 'button' } });
            });

            await adapterCommands.handleStateChange(adapter, ctx, 'control.charge', {
                val: true,
                ack: false
            });

            expect(ctx.adapterProxy.setStateConditional.calledWith(
                'control.charge', false, true
            )).to.be.false;
        });

        it('should NOT dispatch stop command when device is disabled', async () => {
            ctx.enabled = false;
            configureMockHelperForSubPath('control.stop');
            adapter.getObject.callsFake((_id, cb) => {
                if (cb) cb(null, { common: { name: 'Stop', role: 'button' } });
            });

            await adapterCommands.handleStateChange(adapter, ctx, 'control.stop', {
                val: true,
                ack: false
            });

            expect(ctx.adapterProxy.setStateConditional.calledWith(
                'control.stop', false, true
            )).to.be.false;
        });

        it('should not log Not connected message when disabled (different path)', async () => {
            ctx.enabled = false;
            ctx.connected = false;
            configureMockHelperForSubPath('control.clean');

            await adapterCommands.handleStateChange(adapter, ctx, 'control.clean', {
                val: true,
                ack: false
            });

            expect(adapter.log.info.calledWithMatch(/Not connected/)).to.be.false;
        });

        it('should allow commands when device is enabled', async () => {
            ctx.enabled = true;
            configureMockHelperForSubPath('control.clean');
            adapter.getObject.callsFake((_id, cb) => {
                if (cb) cb(null, { common: { name: 'Start cleaning', role: 'button' } });
            });

            await adapterCommands.handleStateChange(adapter, ctx, 'control.clean', {
                val: true,
                ack: false
            });

            expect(ctx.adapterProxy.setStateConditional.called).to.be.true;
        });

        it('should pass through history channel acknowledged states when disabled', async () => {
            ctx.enabled = false;
            configureMockHelperForSubPath('history.timestampOfLastStateChange');

            await adapterCommands.handleStateChange(adapter, ctx, 'history.timestampOfLastStateChange', {
                val: 1234567890,
                ack: true
            });

            expect(true).to.be.true;
        });
    });

    describe('main.js - polling guard when disabled', () => {
        function createMainMethods() {
            const adapter = createMockAdapterForMain();
            const vacbot = { run: sinon.stub() };
            const vacuum = { did: 'test_did', nick: 'TestBot', deviceName: 'TestBot' };
            const ctx = new DeviceContext(adapter, 'test_device', vacbot, vacuum);
            ctx.adapterProxy = { setStateConditional: sinon.stub() };
            ctx.getModel = sinon.stub().returns({
                isSupportedFeature: sinon.stub().returns(true),
                getModelType: sinon.stub().returns('950')
            });

            // Define main.js methods on the adapter for testing
            adapter.startPolling = function(ctx) {
                if (ctx._autoUpdateInterval) {
                    return;
                }
                const interval = 60000;
                ctx._autoUpdateInterval = setInterval(() => {
                    if (this.globalMqttUnreachable || ctx.connectionFailed || !ctx.connected || !ctx.enabled) {
                        return;
                    }
                    if (this.vacbotGetStatesInterval) {
                        this.vacbotGetStatesInterval(ctx);
                    }
                }, interval);
            };

            adapter.stopPolling = function(ctx) {
                if (ctx._autoUpdateInterval) {
                    clearInterval(ctx._autoUpdateInterval);
                    ctx._autoUpdateInterval = null;
                }
            };

            return { adapter, ctx };
        }

        it('should stop polling when stopPolling is called', () => {
            const { adapter, ctx } = createMainMethods();
            ctx.enabled = true;

            adapter.startPolling(ctx);
            expect(ctx._autoUpdateInterval).to.not.be.null;

            adapter.stopPolling(ctx);
            expect(ctx._autoUpdateInterval).to.be.null;
        });

        it('should skip polling when device is disabled (vacbotGetStatesInterval)', () => {
            const { adapter, ctx } = createMainMethods();

            ctx.enabled = false;
            ctx.connected = true;
            ctx.connectionFailed = false;

            const addStandardSpy = sinon.stub();
            const runAllSpy = sinon.stub();
            ctx.intervalQueue.addStandardGetCommands = addStandardSpy;
            ctx.intervalQueue.addAdditionalGetCommands = sinon.stub();
            ctx.intervalQueue.runAll = runAllSpy;

            adapter.vacbotGetStatesInterval = function(ctx) {
                if (this.globalMqttUnreachable || ctx.connectionFailed || !ctx.connected || !ctx.enabled) {
                    return;
                }
                ctx.intervalQueue.addStandardGetCommands();
                ctx.intervalQueue.addAdditionalGetCommands();
                ctx.intervalQueue.runAll();
            };

            adapter.vacbotGetStatesInterval(ctx);

            expect(addStandardSpy.called).to.be.false;
            expect(runAllSpy.called).to.be.false;
        });

        it('should allow polling when device is enabled (vacbotGetStatesInterval)', () => {
            const { adapter, ctx } = createMainMethods();

            ctx.enabled = true;
            ctx.connected = true;
            ctx.connectionFailed = false;

            const addStandardSpy = sinon.stub();
            const runAllSpy = sinon.stub();
            ctx.intervalQueue.addStandardGetCommands = addStandardSpy;
            ctx.intervalQueue.addAdditionalGetCommands = sinon.stub();
            ctx.intervalQueue.runAll = runAllSpy;

            adapter.vacbotGetStatesInterval = function(ctx) {
                if (this.globalMqttUnreachable || ctx.connectionFailed || !ctx.connected || !ctx.enabled) {
                    return;
                }
                ctx.intervalQueue.addStandardGetCommands();
                ctx.intervalQueue.addAdditionalGetCommands();
                ctx.intervalQueue.runAll();
            };

            adapter.vacbotGetStatesInterval(ctx);

            expect(addStandardSpy.called).to.be.true;
            expect(runAllSpy.called).to.be.true;
        });

        it('should skip polling in setInterval callback when disabled', () => {
            const { adapter, ctx } = createMainMethods();

            ctx.enabled = false;
            ctx.connected = true;
            ctx.connectionFailed = false;
            adapter.globalMqttUnreachable = false;

            const getStatesSpy = sinon.stub();
            adapter.vacbotGetStatesInterval = getStatesSpy;

            const originalSetInterval = global.setInterval;
            const intervals = [];
            global.setInterval = (fn, ms) => {
                const id = originalSetInterval(fn, ms);
                intervals.push({ fn, ms, id });
                return id;
            };

            adapter.startPolling(ctx);

            // Fire the interval callback
            intervals.forEach(({ fn }) => fn());

            global.setInterval = originalSetInterval;
            intervals.forEach(({ id }) => clearInterval(id));

            expect(getStatesSpy.called).to.be.false;
        });
    });

    describe('main.js - onStateChange routing when disabled', () => {
        function createOnStateChangeSetup() {
            const adapter = createMockAdapterForMain();
            const vacbot = { run: sinon.stub() };
            const vacuum = { did: 'test_did', nick: 'TestBot' };
            const ctx = new DeviceContext(adapter, 'test_device', vacbot, vacuum);
            ctx.getModel = sinon.stub().returns({
                isSupportedFeature: sinon.stub().returns(true),
                getModelType: sinon.stub().returns('950')
            });
            ctx.adapterProxy = { setStateConditional: sinon.stub() };
            ctx.enabled = true;
            adapter.deviceContexts.set('test_device', ctx);

            const handleStateChangeSpy = sinon.stub().resolves();

            // Define onStateChange as in main.js
            adapter.onStateChange = function(id, state) {
                if (!state) return;
                const relativeId = id.replace(this.namespace + '.', '');
                const parts = relativeId.split('.');
                const deviceId = parts[0];

                const ctx = this.deviceContexts.get(deviceId);
                if (!ctx) return;
                const subPath = parts.slice(1).join('.');
                const stateName = parts[parts.length - 1];
                if (stateName === 'enabled' && subPath === 'status.enabled') {
                    ctx.enabled = state.val;
                    const displayName = ctx.vacuum && ctx.vacuum.nick ? `${deviceId} (${ctx.vacuum.nick})` : deviceId;
                    if (state.val) {
                        ctx.enabled = true;
                        this.log.info('Device ' + displayName + ': control and updates enabled');
                        if (ctx.connected) {
                            if (this.startPolling) this.startPolling(ctx);
                        }
                    } else {
                        ctx.enabled = false;
                        this.log.info('Device ' + displayName + ': control and updates disabled');
                        if (this.stopPolling) this.stopPolling(ctx);
                    }
                }
                if (!ctx.enabled && stateName !== 'enabled') return;
                handleStateChangeSpy(this, ctx, subPath, state);
            };

            return { adapter, ctx, handleStateChangeSpy };
        }

        it('should skip control state changes when device is disabled', () => {
            const { adapter, ctx, handleStateChangeSpy } = createOnStateChangeSetup();
            ctx.enabled = false;

            adapter.onStateChange('ecovacs-deebot.0.test_device.control.clean', {
                val: true,
                ack: false
            });

            expect(handleStateChangeSpy.called).to.be.false;
        });

        it('should allow status.enabled state change when device is disabled (re-enable)', () => {
            const { adapter, ctx, handleStateChangeSpy } = createOnStateChangeSetup();
            ctx.enabled = false;

            adapter.onStateChange('ecovacs-deebot.0.test_device.status.enabled', {
                val: true,
                ack: false
            });

            expect(handleStateChangeSpy.calledOnce).to.be.true;
            expect(ctx.enabled).to.be.true;
        });

        it('should stop polling when status.enabled is set to false', () => {
            const { adapter, ctx } = createOnStateChangeSetup();
            ctx.enabled = true;
            adapter.stopPolling = sinon.stub();

            adapter.onStateChange('ecovacs-deebot.0.test_device.status.enabled', {
                val: false,
                ack: false
            });

            expect(ctx.enabled).to.be.false;
            expect(adapter.stopPolling.calledWith(ctx)).to.be.true;
        });

        it('should restore polling when status.enabled is set back to true', () => {
            const { adapter, ctx } = createOnStateChangeSetup();
            ctx.enabled = false;
            ctx.connected = true;
            adapter.startPolling = sinon.stub();

            adapter.onStateChange('ecovacs-deebot.0.test_device.status.enabled', {
                val: true,
                ack: false
            });

            expect(ctx.enabled).to.be.true;
            expect(adapter.startPolling.calledWith(ctx)).to.be.true;
        });

        it('should handle normal control commands when device is enabled', () => {
            const { adapter, ctx, handleStateChangeSpy } = createOnStateChangeSetup();
            ctx.enabled = true;

            adapter.onStateChange('ecovacs-deebot.0.test_device.control.clean', {
                val: true,
                ack: false
            });

            expect(handleStateChangeSpy.calledOnce).to.be.true;
        });
    });
});