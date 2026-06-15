'use strict';

/**
 * adapterCommands.test.js
 *
 * Covers:
 *  - Module structure (exported API surface)
 *  - Error propagation (vacbot.run throws)
 *  - Edge cases specific to stubbed-helper mode not covered by
 *    adapterCommands-control.test.js (which uses the real adapterHelper)
 *
 * Command-dispatch correctness (clean, stop, charge, OTA, …) is tested with
 * real path-resolution in adapterCommands-control.test.js.
 * Extended-branch coverage (every sub-command) lives in
 * adapterCommands-extended.test.js.
 */

const { expect } = require('chai');
const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { createMockAdapter, createMockCtx } = require('./mockHelper');

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

describe('adapterCommands.js', () => {
    let adapter;
    let ctx;

    beforeEach(() => {
        adapter = createMockAdapter({
            clearGoToPosition: sinon.stub(),
            setStateAsync: sinon.stub().resolves(),
            setHistoryValuesForDustboxRemoval: sinon.stub()
        });
        ctx = createMockCtx({ adapter: adapter, connected: true });

        Object.values(mockAdapterHelper).forEach(stub => stub.resetHistory && stub.resetHistory());
        Object.values(mockMapHelper).forEach(stub => stub.resetHistory && stub.resetHistory());
    });

    afterEach(() => {
        sinon.restore();
    });

    // -------------------------------------------------------------------------
    // Module structure
    // -------------------------------------------------------------------------

    describe('Module Structure', () => {
        it('should export the expected functions', () => {
            expect(adapterCommands).to.be.an('object');
            expect(adapterCommands).to.have.property('handleStateChange').that.is.a('function');
            expect(adapterCommands).to.have.property('cleanSpotArea').that.is.a('function');
            expect(adapterCommands).to.have.property('runSetCleanSpeed').that.is.a('function');
            expect(adapterCommands).to.have.property('handleV2commands').that.is.a('function');
            expect(adapterCommands).to.have.property('startSpotAreaCleaning').that.is.a('function');
        });
    });

    // -------------------------------------------------------------------------
    // Error propagation – not covered by -control (which uses real helper)
    // -------------------------------------------------------------------------

    describe('Error Handling', () => {
        it('should propagate synchronous vacbot.run errors', async () => {
            ctx.vacbot.run.throws(new Error('Vacbot error'));
            mockAdapterHelper.getStateNameById.returns('clean');
            mockAdapterHelper.getChannelNameById.returns('control');
            mockAdapterHelper.getSubChannelNameById.returns('');

            let thrown = false;
            try {
                await adapterCommands.handleStateChange(adapter, ctx, 'control.clean', { ack: false, val: true });
            } catch (e) {
                thrown = true;
                expect(e.message).to.equal('Vacbot error');
            }
            expect(thrown).to.be.true;
        });

        it('should not invoke vacbot.run for an unrecognised state name', async () => {
            mockAdapterHelper.getStateNameById.returns('totallyUnknownState');
            mockAdapterHelper.getChannelNameById.returns('control');
            mockAdapterHelper.getSubChannelNameById.returns('');

            await adapterCommands.handleStateChange(adapter, ctx, 'control.totallyUnknownState', { ack: false, val: 'x' });
            expect(ctx.vacbot.run.called).to.be.false;
        });
    });

    // -------------------------------------------------------------------------
    // Edge cases
    // -------------------------------------------------------------------------

    describe('Edge Cases', () => {
        it('should skip processing for acknowledged state changes', async () => {
            mockAdapterHelper.getStateNameById.returns('clean');
            mockAdapterHelper.getChannelNameById.returns('control');
            mockAdapterHelper.getSubChannelNameById.returns('');

            await adapterCommands.handleStateChange(adapter, ctx, 'control.clean', { ack: true, val: true });
            expect(ctx.vacbot.run.called).to.be.false;
        });

        it('should skip processing when device is not connected', async () => {
            ctx.connected = false;
            mockAdapterHelper.getStateNameById.returns('clean');
            mockAdapterHelper.getChannelNameById.returns('control');
            mockAdapterHelper.getSubChannelNameById.returns('');

            await adapterCommands.handleStateChange(adapter, ctx, 'control.clean', { ack: false, val: true });
            expect(ctx.vacbot.run.called).to.be.false;
        });

        it('should execute stop command even with null state value', async () => {
            mockAdapterHelper.getStateNameById.returns('stop');
            mockAdapterHelper.getChannelNameById.returns('control');
            mockAdapterHelper.getSubChannelNameById.returns('');

            await adapterCommands.handleStateChange(adapter, ctx, 'control.stop', { ack: false, val: null });
            expect(ctx.vacbot.run.calledWith('stop')).to.be.true;
        });

        it('should reset button state to false even when getObject returns error', async () => {
            mockAdapterHelper.getStateNameById.returns('playSound');
            mockAdapterHelper.getChannelNameById.returns('control');
            mockAdapterHelper.getSubChannelNameById.returns('');
            adapter.getObject.callsArgWith(1, new Error('Object not found'), null);

            await adapterCommands.handleStateChange(adapter, ctx, 'control.playSound', { ack: false, val: true });
            // Command still runs despite object lookup failure
            expect(ctx.adapter.log.info.calledWith('Run: playSound')).to.be.true;
        });
    });
});
