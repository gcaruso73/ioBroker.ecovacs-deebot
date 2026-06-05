'use strict';

const { expect } = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

const Queue = require('../lib/adapterQueue');
const { createMockCtx } = require('./mockHelper');

describe('adapterQueue.js - feature branches', () => {
    let ctx;
    let queue;

    function createQueueWithModel(overrides) {
        const ctx = createMockCtx({
            vacbot: {
                run: sinon.stub(),
                hasMoppingSystem: sinon.stub().returns(true),
                hasMainBrush: sinon.stub().returns(true),
                hasUnitCareInfo: sinon.stub().returns(false),
                hasRoundMopInfo: sinon.stub().returns(false),
                hasVacuumPowerAdjustment: sinon.stub().returns(true),
                getDeviceProperty: sinon.stub().returns(false)
            }
        });
        ctx.getModel().isNot950type.returns(true);
        ctx.getModel().is950type.returns(false);
        ctx.getModel().isSupportedFeature.returns(true);
        ctx.getModel().hasAdvancedMode.returns(false);
        ctx.getPlatformType.returns('deebot');

        // Apply overrides
        Object.keys(overrides || {}).forEach(k => {
            const val = overrides[k];
            if (typeof val === 'function') {
                const [target, method] = k.split('.');
                if (target === 'model') ctx.getModel()[method].returns(val());
                else if (target === 'vacbot') ctx.vacbot[method].returns(val());
                else if (target === 'device') ctx.getDevice()[method].returns(val());
            }
        });

        const q = new Queue(ctx, 'testQueue', 500);
        q.add = sinon.stub();

        q.adapter.currentSpotAreaID = 'unknown';
        q.ctx.getDevice().isCleaning.returns(false);

        return { ctx, queue: q };
    }

    describe('addStandardGetCommands - yiko voice assistant', () => {
        it('should add GetVoiceAssistantState when device has yiko property', () => {
            const { queue } = createQueueWithModel();
            queue.ctx.vacbot.getDeviceProperty.withArgs('yiko').returns(true);
            queue.ctx.getModel().vacbot.getDeviceProperty.withArgs('yiko').returns(true);
            queue.addStandardGetCommands();
            expect(queue.add.calledWith('GetVoiceAssistantState')).to.be.true;
        });
    });

    describe('addStandardGetCommands - vacuum power adjustment', () => {
        it('should add GetCleanSpeed when device has vacuum power adjustment', () => {
            const { queue } = createQueueWithModel();
            queue.ctx.vacbot.hasVacuumPowerAdjustment.returns(true);
            queue.addStandardGetCommands();
            expect(queue.add.calledWith('GetCleanSpeed')).to.be.true;
        });

        it('should not add GetCleanSpeed when device lacks vacuum power adjustment', () => {
            const { queue } = createQueueWithModel();
            queue.ctx.vacbot.hasVacuumPowerAdjustment.returns(false);
            queue.addStandardGetCommands();
            expect(queue.add.calledWith('GetCleanSpeed')).to.be.false;
        });
    });

    describe('addStandardGetCommands - advanced mode', () => {
        it('should add GetAdvancedMode when model has advanced mode', () => {
            const { queue } = createQueueWithModel();
            queue.ctx.getModel().hasAdvancedMode.returns(true);
            queue.addStandardGetCommands();
            expect(queue.add.calledWith('GetAdvancedMode')).to.be.true;
        });
    });

    describe('addStandardGetCommands - T20/X2 model types', () => {
        it('should add GetWorkMode for T20 model', () => {
            const { queue } = createQueueWithModel();
            queue.ctx.getModel().isModelTypeT20.returns(true);
            queue.addStandardGetCommands();
            expect(queue.add.calledWith('GetWorkMode')).to.be.true;
            expect(queue.add.calledWith('GetCarpetInfo')).to.be.true;
            expect(queue.add.calledWith('GetWashInterval')).to.be.true;
        });

        it('should add GetWorkMode for X2 model', () => {
            const { queue } = createQueueWithModel();
            queue.ctx.getModel().isModelTypeX2.returns(true);
            queue.addStandardGetCommands();
            expect(queue.add.calledWith('GetWorkMode')).to.be.true;
        });
    });

    describe('addStandardGetCommands - devices with air drying', () => {
        it('should add mopping-related commands for devices with air drying', () => {
            const { ctx, queue } = createQueueWithModel();
            ctx.getModel().hasAirDrying.returns(true);
            queue.addStandardGetCommands();
            expect(queue.add.calledWith('GetSweepMode')).to.be.true;
            expect(queue.add.calledWith('GetBorderSpin')).to.be.true;
            expect(queue.add.calledWith('GetMopOnlyMode')).to.be.true;
        });
    });

    describe('addStandardGetCommands - air drying', () => {
        it('should add GetAirDrying for yeedi model with air drying', () => {
            const { queue } = createQueueWithModel();
            queue.ctx.getModel().hasAirDrying.returns(true);
            queue.ctx.getPlatformType.returns('yeedi');
            queue.addStandardGetCommands();
            expect(queue.add.calledWith('GetAirDrying')).to.be.true;
        });

        it('should add GetStationState for non-yeedi model with air drying', () => {
            const { queue } = createQueueWithModel();
            queue.ctx.getModel().hasAirDrying.returns(true);
            queue.addStandardGetCommands();
            expect(queue.add.calledWith('GetStationState')).to.be.true;
        });
    });

    describe('addAdditionalGetCommands', () => {
        it('should add GetPosition when mapping supported and spot area ID is unknown', () => {
            const { queue } = createQueueWithModel();
            queue.adapter.currentSpotAreaID = 'unknown';
            queue.addStandardGetCommands();
            queue.addAdditionalGetCommands();
            expect(queue.add.calledWith('GetPosition')).to.be.true;
        });

        it('should add GetNetInfo when wifiSignal supported and device is cleaning', () => {
            const { queue } = createQueueWithModel();
            queue.ctx.getModel().isSupportedFeature.withArgs('info.network.wifiSignal').returns(true);
            queue.ctx.getDevice().isCleaning.returns(true);
            queue.addAdditionalGetCommands();
            expect(queue.add.calledWith('GetNetInfo')).to.be.true;
        });

        it('should add clean logs when not acknowledged', () => {
            const { queue } = createQueueWithModel();
            queue.ctx.cleaningLogAcknowledged = false;
            const addGetCleanLogsStub = sinon.stub(queue, 'addGetCleanLogs');
            queue.ctx.getDevice().isCleaning.returns(false);
            queue.addAdditionalGetCommands();
            expect(addGetCleanLogsStub.called).to.be.true;
            addGetCleanLogsStub.restore();
        });
    });

    describe('addGetLifespan', () => {
        it('should add unit_care and round_mop lifespan when supported', () => {
            const { ctx, queue } = createQueueWithModel();
            ctx.vacbot.hasUnitCareInfo.returns(true);
            ctx.vacbot.hasRoundMopInfo.returns(true);
            queue.addGetLifespan();
            expect(queue.add.calledWith('GetLifeSpan', 'unit_care')).to.be.true;
            expect(queue.add.calledWith('GetLifeSpan', 'round_mop')).to.be.true;
        });
    });
});
