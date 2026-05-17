'use strict';

const { expect } = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const Queue = require('../lib/adapterQueue');
const { createMockCtx } = require('./mockHelper');

describe('adapterQueue.js - advanced edge cases', () => {
    let ctx;

    beforeEach(() => {
        ctx = createMockCtx({
            vacbot: {
                run: sinon.stub(),
                hasMoppingSystem: sinon.stub().returns(false),
                hasMainBrush: sinon.stub().returns(true),
                hasUnitCareInfo: sinon.stub().returns(false),
                hasRoundMopInfo: sinon.stub().returns(false),
                hasVacuumPowerAdjustment: sinon.stub().returns(false),
                getDeviceProperty: sinon.stub().returns(false)
            }
        });
        ctx.getModel().isNot950type.returns(true);
        ctx.getModel().is950type.returns(false);
        ctx.getModel().is950type_V2.returns(false);
        ctx.getModel().isNot950type_V2.returns(true);
        ctx.getModel().isMappingSupported.returns(true);
        ctx.getModel().hasAirDrying.returns(false);
        ctx.getModel().isModelTypeAirbot.returns(false);
        ctx.getModel().isModelTypeX1.returns(false);
        ctx.getModel().isModelTypeX2.returns(false);
        ctx.getModel().isModelTypeT20.returns(false);
        ctx.getModel().hasAdvancedMode.returns(false);
        ctx.getModel().isSupportedFeature.returns(true);
        ctx.getModel().vacbot.getDeviceProperty.returns(false);
        ctx.getModelType.returns('deebot');
        ctx.getDevice().useV2commands.returns(false);
        ctx.spotAreaCleanings = 1;
        ctx.cleaningLogAcknowledged = false;
        ctx.silentApproach = { mapSpotAreaID: null };
        ctx.adapter.currentSpotAreaID = 'unknown';
        ctx.adapter.getDevice = sinon.stub().returns({ isCleaning: sinon.stub().returns(false) });
    });

    describe('startNextItemFromQueue - connectionFailed', () => {
        it('should skip and clear entries when connectionFailed and not cleaningQueue', () => {
            const queue = new Queue(ctx, 'commandQueue', 250, true);
            ctx.connectionFailed = true;
            queue.add('GetBatteryInfo');
            queue.add('GetChargeState');
            queue.startNextItemFromQueue();
            expect(ctx.vacbot.run.called).to.be.false;
            expect(queue.entries).to.have.length(0);
        });

        it('should still process cleaningQueue when connectionFailed', () => {
            const queue = new Queue(ctx, 'cleaningQueue', 0, false);
            ctx.connectionFailed = true;
            queue.add('GetBatteryInfo');
            queue.startNextItemFromQueue();
            expect(ctx.vacbot.run.calledOnce).to.be.true;
        });

        it('should process normally when connectionFailed is false', () => {
            const queue = new Queue(ctx, 'commandQueue', 250, true);
            queue.add('GetBatteryInfo');
            queue.startNextItemFromQueue();
            expect(ctx.vacbot.run.calledOnce).to.be.true;
        });
    });

    describe('startNextItemFromQueue - throttle', () => {
        it('should delay when throttle rate limit is reached', function(done) {
            this.timeout(500);
            const getDelay = sinon.stub();
            getDelay.onFirstCall().returns(30);
            getDelay.onSecondCall().returns(0);
            const throttle = { getDelay: getDelay, record: sinon.stub() };
            const queue = new Queue(ctx, 'commandQueue', 250, true, throttle);
            queue.add('GetBatteryInfo');
            queue.startNextItemFromQueue();
            // After 30ms delay, command should execute
            setTimeout(() => {
                expect(ctx.vacbot.run.calledOnce).to.be.true;
                expect(throttle.record.calledOnce).to.be.true;
                done();
            }, 80);
        });

        it('should not delay when throttle allows immediate execution', () => {
            const throttle = { getDelay: sinon.stub().returns(0), record: sinon.stub() };
            const queue = new Queue(ctx, 'commandQueue', 250, true, throttle);
            queue.add('GetBatteryInfo');
            queue.startNextItemFromQueue();
            expect(ctx.vacbot.run.calledOnce).to.be.true;
            expect(throttle.record.calledOnce).to.be.true;
        });

        it('should record throttle for commands with 3 args', () => {
            const throttle = { getDelay: sinon.stub().returns(0), record: sinon.stub() };
            const queue = new Queue(ctx, 'commandQueue', 250, true, throttle);
            queue.add('Cmd', 'a1', 'a2', 'a3');
            queue.startNextItemFromQueue();
            expect(throttle.record.calledOnce).to.be.true;
            expect(ctx.vacbot.run.calledWith('Cmd', 'a1', 'a2', 'a3')).to.be.true;
        });
    });

    describe('startNextItemFromQueue - GetMaps silent approach skip', () => {
        it('should skip GetMaps when silent approach is active', () => {
            ctx.silentApproach.mapSpotAreaID = '0';
            const queue = new Queue(ctx);
            queue.add('GetMaps');
            queue.add('GetBatteryInfo');
            queue.startNextItemFromQueue();
            expect(ctx.vacbot.run.calledWith('GetMaps')).to.be.false;
            expect(queue.entries).to.have.length(1);
            expect(queue.entries[0].cmd).to.equal('GetBatteryInfo');
        });
    });

    describe('addInitialGetCommands - feature paths', () => {
        it('should add SweepMode/BorderSpin/MopOnlyMode for 950type_V2 with mopping', () => {
            ctx.getModel().is950type_V2.returns(true);
            ctx.vacbot.hasMoppingSystem.returns(true);
            const queue = new Queue(ctx);
            queue.addInitialGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetSweepMode');
            expect(cmds).to.include('GetBorderSpin');
            expect(cmds).to.include('GetMopOnlyMode');
        });

        it('should add GetCleanPreference for 950type_V2', () => {
            ctx.getModel().is950type_V2.returns(true);
            const queue = new Queue(ctx);
            queue.addInitialGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetCleanPreference');
        });

        it('should add GetWashInterval for X1 model', () => {
            ctx.getModel().isModelTypeX1.returns(true);
            const queue = new Queue(ctx);
            queue.addInitialGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetWashInterval');
        });

        it('should add GetWashInterval for T20 model', () => {
            ctx.getModel().isModelTypeT20.returns(true);
            const queue = new Queue(ctx);
            queue.addInitialGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetWashInterval');
        });

        it('should add GetAICleanItemState for T9 based', () => {
            ctx.getModel().isModelTypeT9Based.returns(true);
            const queue = new Queue(ctx);
            queue.addInitialGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetAICleanItemState');
        });

        it('should add GetStationInfo/GetWashInfo when has cleaning station', () => {
            ctx.getModel().hasCleaningStation.returns(true);
            const queue = new Queue(ctx);
            queue.addInitialGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetStationInfo');
            expect(cmds).to.include('GetWashInfo');
        });

        it('should skip GetNetInfo when network info not supported', () => {
            ctx.getModel().isSupportedFeature.withArgs('info.network.ip').returns(false);
            const queue = new Queue(ctx);
            queue.addInitialGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.not.include('GetNetInfo');
        });

        it('should add GetAirDrying for yeedi with air drying', () => {
            ctx.getModel().hasAirDrying.returns(true);
            ctx.getModelType.returns('yeedi');
            const queue = new Queue(ctx);
            queue.addInitialGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetAirDrying');
        });

        it('should add GetStationState/GetDryingDuration for non-yeedi air drying', () => {
            ctx.getModel().hasAirDrying.returns(true);
            ctx.getModelType.returns('T20');
            const queue = new Queue(ctx);
            queue.addInitialGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetStationState');
            expect(cmds).to.include('GetDryingDuration');
        });
    });

    describe('addStandardGetCommands - feature paths', () => {
        it('should add GetDoNotDisturb when supported', () => {
            ctx.getModel().isSupportedFeature.withArgs('control.doNotDisturb').returns(true);
            const queue = new Queue(ctx);
            queue.addStandardGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetDoNotDisturb');
        });

        it('should skip GetDoNotDisturb when not supported', () => {
            ctx.getModel().isSupportedFeature.withArgs('control.doNotDisturb').returns(false);
            const queue = new Queue(ctx);
            queue.addStandardGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.not.include('GetDoNotDisturb');
        });

        it('should add GetContinuousCleaning when supported', () => {
            ctx.getModel().isSupportedFeature.withArgs('control.continuousCleaning').returns(true);
            const queue = new Queue(ctx);
            queue.addStandardGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetContinuousCleaning');
        });

        it('should add GetAutoEmpty when supported', () => {
            ctx.getModel().isSupportedFeature.withArgs('control.autoEmptyStation').returns(true);
            const queue = new Queue(ctx);
            queue.addStandardGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetAutoEmpty');
        });

        it('should add GetCarpetPressure when autoBoostSuction supported', () => {
            ctx.getModel().isSupportedFeature.withArgs('control.autoBoostSuction').returns(true);
            const queue = new Queue(ctx);
            queue.addStandardGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetCarpetPressure');
        });

        it('should add GetCleanCount when supported', () => {
            ctx.getModel().isSupportedFeature.withArgs('control.cleanCount').returns(true);
            const queue = new Queue(ctx);
            queue.addStandardGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetCleanCount');
        });

        it('should add GetTrueDetect when trueDetect supported', () => {
            ctx.getModel().isSupportedFeature.withArgs('technology.trueDetect').returns(true);
            const queue = new Queue(ctx);
            queue.addStandardGetCommands();
            const cmds = queue.entries.map(e => e.cmd);
            expect(cmds).to.include('GetTrueDetect');
        });
    });

    describe('addAdditionalGetCommands - edge cases', () => {
        it('should skip GetPosition when area already known', () => {
            ctx.adapter.currentSpotAreaID = 'area_123';
            const queue = new Queue(ctx);
            const addSpy = sinon.spy(queue, 'add');
            queue.addAdditionalGetCommands();
            expect(addSpy.calledWith('GetPosition')).to.be.false;
            addSpy.restore();
        });

        it('should skip GetNetInfo when device not cleaning', () => {
            ctx.getModel().isSupportedFeature.withArgs('info.network.wifiSignal').returns(true);
            const queue = new Queue(ctx);
            const addSpy = sinon.spy(queue, 'add');
            queue.addAdditionalGetCommands();
            expect(addSpy.calledWith('GetNetInfo')).to.be.false;
            addSpy.restore();
        });

        it('should skip clean logs when already acknowledged', () => {
            ctx.cleaningLogAcknowledged = true;
            const queue = new Queue(ctx);
            const spy = sinon.spy(queue, 'addGetCleanLogs');
            queue.addAdditionalGetCommands();
            expect(spy.called).to.be.false;
            spy.restore();
        });
    });

    describe('addGetLifespan - additional cases', () => {
        it('should add air_freshener when supported', () => {
            ctx.getModel().isSupportedFeature.withArgs('consumable.airFreshener').returns(true);
            const queue = new Queue(ctx);
            queue.addGetLifespan();
            const cmds = queue.entries.map(e => e.cmd + ':' + e.arg1);
            expect(cmds).to.include('GetLifeSpan:air_freshener');
        });

        it('should skip air_freshener when not supported', () => {
            ctx.getModel().isSupportedFeature.withArgs('consumable.airFreshener').returns(false);
            const queue = new Queue(ctx);
            queue.addGetLifespan();
            const cmds = queue.entries.map(e => e.cmd + ':' + e.arg1);
            expect(cmds).to.not.include('GetLifeSpan:air_freshener');
        });

        it('should skip lifespan for goat', () => {
            ctx.getModelType.returns('goat');
            const queue = new Queue(ctx);
            queue.addGetLifespan();
            expect(queue.entries.filter(e => e.cmd === 'GetLifeSpan')).to.have.length(0);
        });

        it('should skip lifespan for aqMonitor', () => {
            ctx.getModelType.returns('aqMonitor');
            const queue = new Queue(ctx);
            queue.addGetLifespan();
            expect(queue.entries.filter(e => e.cmd === 'GetLifeSpan')).to.have.length(0);
        });
    });
});
