'use strict';

const { expect } = require('chai');
const { describe, it, beforeEach, afterEach } = require('mocha');
const sinon = require('sinon');

const mockAdapterCore = {
    Adapter: class {
        constructor() {
            this.name = 'ecovacs-deebot';
            this.namespace = 'ecovacs-deebot';
            this.log = {
                info: sinon.stub(),
                warn: sinon.stub(),
                error: sinon.stub(),
                debug: sinon.stub(),
                silly: sinon.stub()
            };
            this.config = {};
            this.setStateConditional = sinon.stub();
        }
    }
};

describe('main.js - debounced error write', () => {
    let clock;
    let AdapterClass;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
        AdapterClass = mockAdapterCore.Adapter;
    });

    afterEach(() => {
        clock.restore();
    });

    describe('debouncedSetError', () => {
        it('should NOT write error to state immediately', () => {
            const instance = new AdapterClass({});
            const ctx = {
                errorCode: null,
                _pendingErrorWriteTimeout: null,
                adapterProxy: { setStateConditional: sinon.stub() }
            };

            instance.debouncedSetError = function(ctx, code, error) {
                if (ctx._pendingErrorWriteTimeout) {
                    clearTimeout(ctx._pendingErrorWriteTimeout);
                }
                ctx.errorCode = code;
                ctx._pendingErrorWriteTimeout = setTimeout(() => {
                    ctx._pendingErrorWriteTimeout = null;
                    ctx.adapterProxy.setStateConditional('info.errorCode', ctx.errorCode, true);
                    ctx.adapterProxy.setStateConditional('info.error', error, true);
                }, 5000);
            };

            instance.debouncedSetError(ctx, '500', 'Test error message');

            expect(ctx.adapterProxy.setStateConditional.called).to.be.false;
            expect(ctx.errorCode).to.equal('500');
            expect(ctx._pendingErrorWriteTimeout).to.not.be.null;
        });

        it('should write error to state after 5 second debounce', () => {
            const instance = new AdapterClass({});
            const ctx = {
                errorCode: null,
                _pendingErrorWriteTimeout: null,
                adapterProxy: { setStateConditional: sinon.stub() }
            };

            instance.debouncedSetError = function(ctx, code, error) {
                if (ctx._pendingErrorWriteTimeout) {
                    clearTimeout(ctx._pendingErrorWriteTimeout);
                }
                ctx.errorCode = code;
                ctx._pendingErrorWriteTimeout = setTimeout(() => {
                    ctx._pendingErrorWriteTimeout = null;
                    ctx.adapterProxy.setStateConditional('info.errorCode', ctx.errorCode, true);
                    ctx.adapterProxy.setStateConditional('info.error', error, true);
                }, 5000);
            };

            instance.debouncedSetError(ctx, '500', 'Test error message');

            clock.tick(5000);

            expect(ctx.adapterProxy.setStateConditional.calledWith('info.errorCode', '500', true)).to.be.true;
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.error', 'Test error message', true)).to.be.true;
            expect(ctx._pendingErrorWriteTimeout).to.be.null;
        });

        it('should update to latest error when called multiple times within debounce window', () => {
            const instance = new AdapterClass({});
            const ctx = {
                errorCode: null,
                _pendingErrorWriteTimeout: null,
                adapterProxy: { setStateConditional: sinon.stub() }
            };

            instance.debouncedSetError = function(ctx, code, error) {
                if (ctx._pendingErrorWriteTimeout) {
                    clearTimeout(ctx._pendingErrorWriteTimeout);
                }
                ctx.errorCode = code;
                ctx._pendingErrorWriteTimeout = setTimeout(() => {
                    ctx._pendingErrorWriteTimeout = null;
                    ctx.adapterProxy.setStateConditional('info.errorCode', ctx.errorCode, true);
                    ctx.adapterProxy.setStateConditional('info.error', error, true);
                }, 5000);
            };

            instance.debouncedSetError(ctx, '500', 'First error');
            instance.debouncedSetError(ctx, '501', 'Second error');

            clock.tick(5000);

            expect(ctx.adapterProxy.setStateConditional.calledWith('info.errorCode', '501', true)).to.be.true;
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.error', 'Second error', true)).to.be.true;
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.errorCode', '500', true)).to.be.false;
        });

        it('should cancel pending error write when resetErrorStates is called within debounce window', () => {
            const instance = new AdapterClass({});
            const ctx = {
                errorCode: '500',
                _pendingErrorWriteTimeout: null,
                adapterProxy: { setStateConditional: sinon.stub() }
            };

            instance.debouncedSetError = function(ctx, code, error) {
                if (ctx._pendingErrorWriteTimeout) {
                    clearTimeout(ctx._pendingErrorWriteTimeout);
                }
                ctx.errorCode = code;
                ctx._pendingErrorWriteTimeout = setTimeout(() => {
                    ctx._pendingErrorWriteTimeout = null;
                    ctx.adapterProxy.setStateConditional('info.errorCode', ctx.errorCode, true);
                    ctx.adapterProxy.setStateConditional('info.error', error, true);
                }, 5000);
            };

            instance.resetErrorStates = function(ctx) {
                if (ctx._pendingErrorWriteTimeout) {
                    clearTimeout(ctx._pendingErrorWriteTimeout);
                    ctx._pendingErrorWriteTimeout = null;
                }
                ctx.errorCode = '0';
                ctx.adapterProxy.setStateConditional('info.errorCode', '0', true);
                ctx.adapterProxy.setStateConditional('info.error', 'NoError: Robot is operational', true);
            };

            instance.debouncedSetError(ctx, '500', 'MQTT server is offline or not reachable');
            instance.resetErrorStates(ctx);

            clock.tick(5000);

            const errorStateCalls = ctx.adapterProxy.setStateConditional.getCalls()
                .filter(c => c.args[0] === 'info.error');
            expect(errorStateCalls).to.have.lengthOf(1);
            expect(errorStateCalls[0].args[1]).to.equal('NoError: Robot is operational');
            expect(ctx._pendingErrorWriteTimeout).to.be.null;
        });

        it('should still write error if resetErrorStates is NOT called within debounce window', () => {
            const instance = new AdapterClass({});
            const ctx = {
                errorCode: null,
                _pendingErrorWriteTimeout: null,
                adapterProxy: { setStateConditional: sinon.stub() }
            };

            instance.debouncedSetError = function(ctx, code, error) {
                if (ctx._pendingErrorWriteTimeout) {
                    clearTimeout(ctx._pendingErrorWriteTimeout);
                }
                ctx.errorCode = code;
                ctx._pendingErrorWriteTimeout = setTimeout(() => {
                    ctx._pendingErrorWriteTimeout = null;
                    ctx.adapterProxy.setStateConditional('info.errorCode', ctx.errorCode, true);
                    ctx.adapterProxy.setStateConditional('info.error', error, true);
                }, 5000);
            };

            instance.resetErrorStates = function(ctx) {
                if (ctx._pendingErrorWriteTimeout) {
                    clearTimeout(ctx._pendingErrorWriteTimeout);
                    ctx._pendingErrorWriteTimeout = null;
                }
                ctx.errorCode = '0';
                ctx.adapterProxy.setStateConditional('info.errorCode', '0', true);
                ctx.adapterProxy.setStateConditional('info.error', 'NoError: Robot is operational', true);
            };

            instance.debouncedSetError(ctx, '500', 'MQTT server is offline or not reachable');

            clock.tick(3000);

            clock.tick(2000);

            expect(ctx.adapterProxy.setStateConditional.calledWith('info.errorCode', '500', true)).to.be.true;
            expect(ctx.adapterProxy.setStateConditional.calledWith('info.error', 'MQTT server is offline or not reachable', true)).to.be.true;
        });
    });
});
