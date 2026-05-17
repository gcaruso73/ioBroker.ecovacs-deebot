'use strict';

const { expect } = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { createMockAdapter } = require('./mockHelper');

describe('DeviceContext - skipPrefix', () => {
    let DeviceContext;

    beforeEach(() => {
        const mockQueue = class { constructor() {} };
        DeviceContext = proxyquire('../lib/deviceContext', { './adapterQueue': mockQueue });
    });

    it('default behaviour prepends deviceId', () => {
        const ma = createMockAdapter();
        const ctx = new DeviceContext(ma, 'D1234567_0', { on: sinon.stub() }, { did: 'test' });
        ctx.adapterProxy.createObjectNotExists('info.battery', 'B', 'number', 'val', false, 0);
        expect(ma.createObjectNotExists.firstCall.args[0]).to.equal('D1234567_0.info.battery');
    });

    it('skipPrefix=true does NOT prepend', () => {
        const ma = createMockAdapter();
        const ctx = new DeviceContext(ma, 'D1234567_0', { on: sinon.stub() }, { did: 'test' }, null, true);
        ctx.adapterProxy.createObjectNotExists('info.battery', 'B', 'number', 'val', false, 0);
        expect(ma.createObjectNotExists.firstCall.args[0]).to.equal('info.battery');
    });

    it('statePath default returns deviceId+path', () => {
        const ctx = new DeviceContext(createMockAdapter(), 'D1234567_0', { on: sinon.stub() }, { did: 'test' });
        expect(ctx.statePath('info.battery')).to.equal('D1234567_0.info.battery');
    });

    it('statePath with skipPrefix returns path as-is', () => {
        const ctx = new DeviceContext(createMockAdapter(), 'D1234567_0', { on: sinon.stub() }, { did: 'test' }, null, true);
        expect(ctx.statePath('info.battery')).to.equal('info.battery');
    });
});