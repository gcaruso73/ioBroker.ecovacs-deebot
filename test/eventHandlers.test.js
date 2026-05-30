'use strict';

const { expect } = require('chai');
const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');
const eventHandlers = require('../lib/eventHandlers');

describe('eventHandlers.js - functionality', () => {
    let main;
    let vacbot;
    let ctx;
    let vacuum;
    let events;

    beforeEach(() => {
        events = {};
        vacbot = {
            on: sinon.stub().callsFake((event, handler) => {
                events[event] = handler;
            })
        };
        main = {
            log: {
                debug: sinon.stub(),
                info: sinon.stub(),
                warn: sinon.stub(),
                error: sinon.stub(),
                silly: sinon.stub()
            },
            updateDeviceConnectionState: sinon.stub(),
            clearUnreachableRetry: sinon.stub(),
            updateConnectionState: sinon.stub(),
            setDeviceStatusByTrigger: sinon.stub(),
            resetErrorStates: sinon.stub(),
            _flushPendingPosition: sinon.stub(),
            resetCurrentStats: sinon.stub(),
            setPauseBeforeDockingIfWaterboxInstalled: sinon.stub().resolves(),
            handleSilentApproach: sinon.stub(),
            createInfoExtendedChannelNotExists: sinon.stub().resolves(),
            handleAirDryingActive: sinon.stub(),
            handlePositionObj: sinon.stub().resolves(),
            handleWaterBoxMoppingType: sinon.stub().resolves(),
            handleWaterBoxScrubbingType: sinon.stub().resolves(),
            handleSweepMode: sinon.stub().resolves(),
            getCurrentDateAndTimeFormatted: sinon.stub().returns('2026-05-30 12:00:00'),
            version: '2.0.4',
            formatDate: sinon.stub().returns('30.05.2026 12:00:00'),
            writeFileAsync: sinon.stub().resolves(),
            namespace: 'test.0',
            getConfigValue: sinon.stub().returns(1),
            getHoursUntilDustBagEmptyReminderFlagIsSet: sinon.stub().returns(0),
            setConnection: sinon.stub(),
            debouncedSetError: sinon.stub(),
            incrementCommandFailedCount: sinon.stub(),
            scheduleUnreachableRetry: sinon.stub(),
            createAirDryingStates: sinon.stub().resolves(),
            downloadLastCleaningMapImage: sinon.stub(),
            setHistoryValuesForDustboxRemoval: sinon.stub(),
            addToLast20Errors: sinon.stub(),
            setGlobalMqttUnreachable: sinon.stub(),
            handleDeviceDataReceived: sinon.stub(),
            canvasModuleIsInstalled: false
        };
        vacuum = {
            nick: 'MyDeebot'
        };
        ctx = {
            deviceId: 'testDevice',
            connected: false,
            unreachableWarningSent: false,
            unreachableRetryCount: 0,
            vacuum: vacuum,
            adapter: main,
            cleaningQueue: {
                notEmpty: sinon.stub().returns(false),
                startNextItemFromQueue: sinon.stub()
            },
            intervalQueue: {
                add: sinon.stub(),
                addGetLifespan: sinon.stub(),
                addGetCleanLogs: sinon.stub()
            },
            adapterProxy: {
                setStateConditional: sinon.stub(),
                setStateConditionalAsync: sinon.stub().resolves(),
                createObjectNotExists: sinon.stub().resolves(),
                createChannelNotExists: sinon.stub().resolves(),
                setObjectNotExistsAsync: sinon.stub().resolves(),
                getStateAsync: sinon.stub().resolves(null),
                createChannel: sinon.stub().resolves(),
                extendObjectAsync: sinon.stub().resolves(),
                getObjectAsync: sinon.stub().resolves(null)
            },
            api: {
                getVersion: sinon.stub().returns('1.2.3')
            },
            getModel: sinon.stub().returns({
                getDeviceClass: () => 'testClass',
                getProductName: () => 'Test Deebot',
                getDeviceCategory: () => 'Vacuum Cleaner',
                getDeviceCapabilities: () => ({ type: 'Vacuum Cleaner', hasMapping: true }),
                getProductImageURL: () => 'http://example.com/image.png',
                getProtocol: () => 'MQTT',
                is950type: () => true,
                isMappingSupported: () => true,
                isSupportedFeature: sinon.stub().returns(true),
                isModelTypeAirbot: () => false,
                isModelTypeT20: () => false,
                isModelTypeX2: () => false,
                isModelTypeX1: () => false,
                isModelTypeT9Based: () => false,
                isModelTypeT8: () => false,
                isModelTypeN8: () => false,
                isModelTypeT9: () => false,
                isModelTypeT10: () => false,
                isModelTypeAqMonitor: () => false
            }),
            getPlatformType: sinon.stub().returns('950'),
            getDevice: sinon.stub().returns({
                isNotStopped: () => true,
                isNotCharging: sinon.stub().returns(true),
                setBatteryLevel: sinon.stub()
            }),
            cleaningClothReminder: {
                enabled: false,
                period: 30
            }
        };
    });

    describe('registerChargeStateEvent', () => {
        it('should handle "charging" status', () => {
            eventHandlers.registerChargeStateEvent(main, vacbot, ctx);
            events.ChargeState('charging');

            expect(ctx.chargestatus).to.equal('charging');
            expect(main.setDeviceStatusByTrigger.calledWith(ctx, 'chargestatus')).to.be.true;
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.chargestatus', 'charging', true)).to.be.true;
        });
    });

    describe('registerCleanReportEvent', () => {
        it('should handle "stop" status', () => {
            eventHandlers.registerCleanReportEvent(main, vacbot, ctx);
            events.CleanReport('stop');

            expect(ctx.cleanstatus).to.equal('stop');
            expect(main._flushPendingPosition.calledOnce).to.be.true;
        });
    });

    describe('registerWaterCleaningEvents', () => {
        it('should handle multiple water cleaning events', async () => {
            const adapterObjects = require('../lib/adapterObjects');
            sinon.stub(adapterObjects, 'createControlWaterLevelIfNotExists').resolves();
            
            eventHandlers.registerWaterCleaningEvents(main, vacbot, ctx);
            await events.WaterLevel(2);
            events.WaterBoxInfo('1');
            await events.CarpetPressure('1');
            await events.CleanPreference('1');
            await events.VoiceAssistantState(true);
            await events.BorderSpin('1');
            await events.MopOnlyMode('1');
            events.SweepMode(1);

            expect(ctx.waterLevel).to.equal(2);
            expect(ctx.waterboxInstalled).to.be.true;
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.autoBoostSuction', true, true)).to.be.true;
            expect(ctx.cleanPreference).to.be.true;
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.voiceAssistant', true, true)).to.be.true;
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.edgeDeepCleaning', true, true)).to.be.true;
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.mopOnlyMode', true, true)).to.be.true;
            expect(main.handleSweepMode.calledOnce).to.be.true;
            
            adapterObjects.createControlWaterLevelIfNotExists.restore();
        });
    });

    describe('registerConnectionEvents', () => {
        it('should handle various connection events', () => {
            eventHandlers.registerConnectionEvents(main, vacbot, ctx);
            
            events.Evt({});
            expect(main.handleDeviceDataReceived.calledOnce).to.be.true;

            events.LastError({ code: '0', error: 'No error' });
            expect(ctx.connected).to.be.true;

            events.LastError({ code: '110', error: 'Dustbox removed' });
            expect(main.addToLast20Errors.calledWith(ctx, '110', 'Dustbox removed')).to.be.true;
            expect(main.setHistoryValuesForDustboxRemoval.calledOnce).to.be.true;

            events.LastError({ code: '500', error: 'MQTT server is offline or not reachable' });
            expect(main.setGlobalMqttUnreachable.calledOnce).to.be.true;

            events.Debug('debug message');
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.library.debugMessage', 'debug message', true)).to.be.true;

            events.messageReceived('message');
            expect(ctx.adapterProxy.setStateConditional.calledWith('history.timestampOfLastMessageReceived')).to.be.true;

            events.genericCommandPayload({ foo: 'bar' });
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.genericCommand.responsePayload', JSON.stringify({ foo: 'bar' }), true)).to.be.true;

            ctx.connected = true;
            events.disconnect('some error');
            expect(ctx.connected).to.be.false;
            expect(main.scheduleUnreachableRetry.calledOnce).to.be.true;
        });
    });

    describe('registerReadyEvent', () => {
        let adapterObjects;
        
        beforeEach(() => {
            adapterObjects = require('../lib/adapterObjects');
            sinon.stub(adapterObjects, 'createAdditionalObjects').resolves();
            sinon.stub(adapterObjects, 'createDeviceCapabilityObjects').resolves();
            sinon.stub(adapterObjects, 'createStationObjects').resolves();
            main.setInitialStateValues = sinon.stub().resolves();
            main.vacbotInitialGetStates = sinon.stub();
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should perform heavy init on first "ready" event', async () => {
            const readyPromise = eventHandlers.registerReadyEvent(main, vacbot, ctx, vacuum);
            events.ready();
            await readyPromise;

            expect(ctx.connected).to.be.true;
            expect(ctx._readyInitDone).to.be.true;
        });
    });

    describe('registerStationEvents', () => {
        it('should handle multiple station events', async () => {
            eventHandlers.registerStationEvents(main, vacbot, ctx);
            
            await events.AirDryingState('drying');
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.extended.airDryingState', 'drying', true)).to.be.true;

            events.WashInterval(15);
            // wait for async IIFE
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(ctx.adapterProxy.setStateConditionalAsync.calledWith('info.extended.washInterval', 15, true)).to.be.true;

            events.WorkMode(1);
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(ctx.adapterProxy.setStateConditionalAsync.calledWith('control.extended.cleaningMode', 1, true)).to.be.true;

            await events.CarpetInfo(1);
            expect(ctx.adapterProxy.setStateConditionalAsync.calledWith('control.extended.carpetCleaningStrategy', 1, true)).to.be.true;

            await events.StationState({ isAirDrying: true, isSelfCleaning: false, isActive: true });
            expect(ctx.cleanstatus).to.equal('drying');

            await events.DryingDuration(120);
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.airDryingDuration', 120, true)).to.be.true;

            await events.AICleanItemState({ particleRemoval: true, petPoopPrevention: true });
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.extended.particleRemoval', true, true)).to.be.true;

            await events.StationInfo({ state: 1, name: 'Station', model: 'M1', sn: '123', wkVer: '1.0' });
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.extended.cleaningStation.state', 1, true)).to.be.true;

            events.DusterRemind({ enabled: '1', period: '30' });
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(ctx.cleaningClothReminder.enabled).to.be.true;
        });
    });

    describe('registerAirbotEvents', () => {
        it('should handle all Airbot events', async () => {
            eventHandlers.registerAirbotEvents(main, vacbot, ctx);
            
            await events.BlueSpeaker({ enable: 1 });
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.bluetoothSpeaker', true, true)).to.be.true;

            await events.Mic(1);
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.microphone', true, true)).to.be.true;

            await events.VoiceSimple(1);
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.voiceReport', true, true)).to.be.true;

            await events.ThreeModuleStatus([{ type: 'uvLight', state: 1, work: 1 }]);
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.airPurifierModules.uvSanitization', 'active', true)).to.be.true;

            await events.AirQuality({ particulateMatter10: 10, particulateMatter25: 5, airQualityIndex: 1, volatileOrganicCompounds: 0.1, temperature: 22, humidity: 50, volatileOrganicCompounds_parts: 100 });
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.airQuality.airQualityIndex', 1, true)).to.be.true;

            events.AtmoLight(2);
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(ctx.adapterProxy.setStateConditionalAsync.calledWith('control.extended.atmoLight', 2, true)).to.be.true;

            events.AtmoVolume(10);
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(ctx.adapterProxy.setStateConditionalAsync.calledWith('control.extended.atmoVolume', 10, true)).to.be.true;

            await events.AutonomousClean(1);
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.linkedPurification.selfLinkedPurification', true, true)).to.be.true;

            events.AirbotAutoModel({ enable: 1, aq: { aqEnd: 1, aqStart: 2 } });
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(ctx.adapterProxy.setStateConditionalAsync.calledWith('control.linkedPurification.linkedPurificationAQ', '1,2,1', true)).to.be.true;

            await events.ThreeModule([{ type: 'uvLight', enable: 1 }, { type: 'smell', enable: 1, level: 2 }, { type: 'humidify', enable: 0, level: 45 }]);
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.airPurifierModules.uvSanitization', true, true)).to.be.true;

            events.CleanSum({ totalSquareMeters: 100, totalSeconds: 3600, totalNumber: 10 });
            expect(ctx.adapterProxy.setStateConditional.calledWith('cleaninglog.totalSquareMeters', 100, true)).to.be.true;

            events.CleanLog({ some: 'log' });
            await new Promise(resolve => setTimeout(resolve, 0));
            
            events.LastCleanLogs({ timestamp: 1234567890, totalTime: 3600, totalTimeFormatted: '1h', squareMeters: 20, imageUrl: 'http://img' });
            expect(ctx.adapterProxy.setStateConditional.calledWith('cleaninglog.lastTotalSeconds', 3600, true)).to.be.true;

            await events.CurrentStats({ cleanedArea: 5, cleanedSeconds: 600, cleanType: 'auto' });
            expect(ctx.currentCleanedArea).to.equal(5);
        });
    });

    describe('registerMiscEventHandlers', () => {
        it('should handle all Misc events', async () => {
            eventHandlers.registerMiscEventHandlers(main, vacbot, ctx);
            
            await events.Ota({ status: 'idle', progress: 0, ver: '1.0', result: 0, supportAuto: 1, isForce: 0, autoSwitch: 1 });
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.ota.status', 'idle', true)).to.be.true;

            events.Schedule([{ id: 1 }]);
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(ctx.adapterProxy.setStateConditionalAsync.calledWith('info.extended.currentSchedule', JSON.stringify([{ id: 1 }]), true)).to.be.true;

            events.NetworkInfo({ ip: '1.2.3.4', wifiSSID: 'SSID', wifiSignal: -50, mac: 'AA:BB' });
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.network.ip', '1.2.3.4', true)).to.be.true;

            events.RelocationState('required');
            expect(ctx.relocationState).to.equal('required');

            await events.HeaderInfo({ fwVer: '1.2.3' });
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.firmwareVersion', '1.2.3', true)).to.be.true;

            events.WaterBoxMoppingType(1);
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(main.handleWaterBoxMoppingType.calledWith(ctx, 1)).to.be.true;

            await events.WashInfo(1);
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.extended.washInfo', 1, true)).to.be.true;

            events.SleepStatus('1');
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.sleepStatus', true, true)).to.be.true;

            events.DoNotDisturbEnabled('1');
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.doNotDisturb', true, true)).to.be.true;

            events.AutoEmptyStatus({ autoEmptyEnabled: true, stationActive: true, dustBagFull: false });
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.autoEmpty', true, true)).to.be.true;

            await events.ChargeMode('mode');
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.chargemode', 'mode', true)).to.be.true;

            events.Volume('5');
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.volume', 5, true)).to.be.true;

            events.CleanCount('2');
            expect(ctx.adapterProxy.setStateConditional.calledWith('control.extended.cleanCount', 2, true)).to.be.true;

            events.BatteryInfo(85);

            await events.CleanSpeed('strong');
            expect(ctx.cleanSpeed).to.equal('strong');
        });
    });
});
