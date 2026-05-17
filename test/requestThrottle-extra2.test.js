'use strict';

const { expect } = require('chai');
const { describe, it } = require('mocha');
const sinon = require('sinon');

const RequestThrottle = require('../lib/requestThrottle');

describe('RequestThrottle - extended edge cases', function() {
    describe('_cleanup edge cases', function() {
        it('should handle empty timestamps', function() {
            const t = new RequestThrottle();
            expect(() => t._cleanup()).to.not.throw();
            expect(t.timestamps).to.have.length(0);
        });

        it('should remove multiple expired entries', function(done) {
            const t = new RequestThrottle({ maxRequests: 5, windowMs: 50 });
            t.record();
            t.record();
            setTimeout(() => {
                t.record();
                t._cleanup();
                expect(t.timestamps).to.have.length(1);
                done();
            }, 60);
        });
    });

    describe('record with cleanup', function() {
        it('should remove expired timestamps during record', function(done) {
            const t = new RequestThrottle({ maxRequests: 5, windowMs: 50 });
            t.record();
            t.record();
            setTimeout(() => {
                t.record();
                expect(t.timestamps).to.have.length(1);
                done();
            }, 60);
        });
    });

    describe('getDelay edge cases', function() {
        it('should return 0 after window expires', function(done) {
            const t = new RequestThrottle({ maxRequests: 2, windowMs: 50 });
            t.record();
            t.record();
            expect(t.getDelay()).to.be.greaterThan(0);
            setTimeout(() => {
                expect(t.getDelay()).to.equal(0);
                done();
            }, 60);
        });
    });

    describe('getStatus after cleanup', function() {
        it('should return 0 current after all expired', function(done) {
            const t = new RequestThrottle({ maxRequests: 5, windowMs: 50 });
            t.record();
            t.record();
            setTimeout(() => {
                const s = t.getStatus();
                expect(s.current).to.equal(0);
                expect(s.max).to.equal(5);
                done();
            }, 60);
        });
    });

    describe('Constructor edge cases', function() {
        it('should handle negative maxRequests', function() {
            const t = new RequestThrottle({ maxRequests: -1 });
            expect(t.maxRequests).to.equal(-1)
            expect(t.canProceed()).to.be.false;
        });

        it('should handle zero windowMs', function() {
            const t = new RequestThrottle({ maxRequests: 5, windowMs: 0 });
            t.record();
            expect(t.canProceed()).to.be.true;
        });
    });

    describe('Logging edge cases', function() {
        it('should call log.debug with correct format', function() {
            const log = { debug: sinon.stub() };
            const t = new RequestThrottle({ maxRequests: 1, windowMs: 60000, log });
            t.record();
            t.getDelay();
            expect(log.debug.calledOnce).to.be.true;
            expect(log.debug.firstCall.args[0]).to.include('[throttle]');
        });

        it('should throw when log object lacks debug method', function() {
            const t = new RequestThrottle({ maxRequests: 1, windowMs: 60000, log: {} });
            t.record();
            expect(() => t.getDelay()).to.throw();
        });
    });

    describe('Options defaults', function() {
        it('should use defaults for partial options', function() {
            const t = new RequestThrottle({ maxRequests: 5 });
            expect(t.maxRequests).to.equal(5);
            expect(t.windowMs).to.equal(30000);
            expect(t.log).to.be.null;
        });
    });
});
