'use strict';

const { expect } = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');

describe('commandRegistry.js', () => {
    let registry;

    beforeEach(() => {
        delete require.cache[require.resolve('../lib/commandRegistry')];
        registry = require('../lib/commandRegistry');
    });

    describe('createRegistry()', () => {
        it('should return object with register, get, getAll methods', () => {
            const reg = registry.createRegistry();
            expect(reg).to.have.property('register').that.is.a('function');
            expect(reg).to.have.property('get').that.is.a('function');
            expect(reg).to.have.property('getAll').that.is.a('function');
        });

        it('should register and retrieve a handler', () => {
            const reg = registry.createRegistry();
            const handler = sinon.stub();
            reg.register('testCmd', handler);
            expect(reg.get('testCmd')).to.equal(handler);
        });

        it('should return undefined for unregistered keys', () => {
            const reg = registry.createRegistry();
            expect(reg.get('nonexistent')).to.be.undefined;
        });

        it('should override existing handler when registering same key', () => {
            const reg = registry.createRegistry();
            const h1 = sinon.stub();
            const h2 = sinon.stub();
            reg.register('cmd', h1);
            reg.register('cmd', h2);
            expect(reg.get('cmd')).to.equal(h2);
            expect(reg.get('cmd')).to.not.equal(h1);
        });

        it('getAll should return the internal Map', () => {
            const reg = registry.createRegistry();
            const handler = sinon.stub();
            reg.register('cmd1', handler);
            reg.register('cmd2', handler);
            const all = reg.getAll();
            expect(all).to.be.instanceOf(Map);
            expect(all.size).to.equal(2);
            expect(all.has('cmd1')).to.be.true;
        });

        it('each createRegistry call returns a fresh registry', () => {
            const reg1 = registry.createRegistry();
            const reg2 = registry.createRegistry();
            reg1.register('test', sinon.stub());
            expect(reg2.get('test')).to.be.undefined;
        });
    });
});
