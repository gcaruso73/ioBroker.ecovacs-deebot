'use strict';

const { expect } = require('chai');
const { describe, it, before, beforeEach } = require('mocha');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

// Loads the real main.js (with mocked dependencies) and exercises the actual
// ensureDeviceConfigEntries() implementation, which auto-populates the
// per-device "devices" configuration from the discovered devices.
describe('main.js - ensureDeviceConfigEntries', () => {
    let EcovacsDeebotFactory;
    let instance;

    const mockNodeMachineId = { machineIdSync: sinon.stub().returns('test-machine-id') };

    function MockEcoVacsAPI() {}
    MockEcoVacsAPI.md5 = sinon.stub().returns('mocked-md5');
    MockEcoVacsAPI.getDeviceId = sinon.stub().returns('mocked-device-id');
    MockEcoVacsAPI.REALM = 'mocked-realm';
    MockEcoVacsAPI.isCanvasModuleAvailable = sinon.stub().returns(false);

    const mockEcovacsDeebot = {
        EcoVacsAPI: MockEcoVacsAPI,
        countries: { DE: { continent: 'EU' } }
    };

    const mockAdapterCore = {
        Adapter: class {
            constructor(options) {
                Object.assign(this, options || {});
                this.name = 'ecovacs-deebot';
                this.namespace = 'ecovacs-deebot.0';
                this.log = {
                    info: sinon.stub(),
                    warn: sinon.stub(),
                    error: sinon.stub(),
                    debug: sinon.stub(),
                    silly: sinon.stub()
                };
                this.config = {};
                this.deviceContexts = new Map();
                this.on = sinon.stub();
                this.setStateConditional = sinon.stub();
                this.getForeignObjectAsync = sinon.stub().resolves(null);
                this.setForeignObjectAsync = sinon.stub().resolves();
            }
        }
    };

    const noop = sinon.stub();
    const mockAdapterObjects = {
        createInitialInfoObjects: sinon.stub().resolves(),
        createInitialObjects: sinon.stub().resolves(),
        createAdditionalObjects: sinon.stub().resolves(),
        createDeviceCapabilityObjects: sinon.stub().resolves(),
        createStationObjects: sinon.stub().resolves()
    };

    before(() => {
        EcovacsDeebotFactory = proxyquire('../main', {
            '@iobroker/adapter-core': mockAdapterCore,
            'ecovacs-deebot': mockEcovacsDeebot,
            'node-machine-id': mockNodeMachineId,
            './lib/adapterObjects': mockAdapterObjects,
            './lib/adapterCommands': { handleStateChange: sinon.stub().resolves() },
            './lib/constants': { MIN_POLLING_INTERVAL_MS: 10000 },
            './lib/adapterHelper': { getUnixTimestamp: sinon.stub().returns(0) },
            './lib/models': class {},
            './lib/device': class {},
            './lib/deviceContext': class {},
            './lib/requestThrottle': class {},
            './lib/mapObjects': {},
            './lib/eventHandlers': {},
            './lib/mapHelper': {},
            'axios': { default: { get: noop } },
            'crypto': require('crypto')
        });
    });

    beforeEach(() => {
        sinon.resetHistory();
        instance = EcovacsDeebotFactory({});
    });

    /** Build a foreign instance object with the given native.devices array. */
    function instanceObj(devices) {
        return { _id: 'system.adapter.ecovacs-deebot.0', native: devices === undefined ? {} : { devices } };
    }

    it('adds an entry for every discovered device when none are configured', async () => {
        const obj = instanceObj([]);
        instance.getForeignObjectAsync = sinon.stub().resolves(obj);
        instance.setForeignObjectAsync = sinon.stub().resolves();

        const devices = [
            { did: 'aaa111', nick: 'Living Room', deviceName: 'DEEBOT X1' },
            { did: 'bbb222', deviceName: 'DEEBOT N8' }
        ];

        const changed = await instance.ensureDeviceConfigEntries(devices);

        expect(changed).to.be.true;
        expect(instance.setForeignObjectAsync.calledOnce).to.be.true;
        const written = instance.setForeignObjectAsync.firstCall.args[1].native.devices;
        expect(written).to.have.lengthOf(2);
        expect(written[0]).to.deep.equal({ name: 'Living Room', deviceId: 'aaa111' });
        // name falls back to deviceName when nick is missing
        expect(written[1]).to.deep.equal({ name: 'DEEBOT N8', deviceId: 'bbb222' });
    });

    it('writes the config object to the adapter instance id', async () => {
        instance.getForeignObjectAsync = sinon.stub().resolves(instanceObj([]));
        instance.setForeignObjectAsync = sinon.stub().resolves();

        await instance.ensureDeviceConfigEntries([{ did: 'aaa111', nick: 'Bot' }]);

        expect(instance.setForeignObjectAsync.firstCall.args[0]).to.equal('system.adapter.ecovacs-deebot.0');
    });

    it('does not write when all discovered devices are already configured', async () => {
        const obj = instanceObj([
            { name: 'Living Room', deviceId: 'aaa111' },
            { name: 'Bedroom', deviceId: 'bbb222' }
        ]);
        instance.getForeignObjectAsync = sinon.stub().resolves(obj);
        instance.setForeignObjectAsync = sinon.stub().resolves();

        const changed = await instance.ensureDeviceConfigEntries([
            { did: 'aaa111', nick: 'Living Room' },
            { did: 'bbb222', nick: 'Bedroom' }
        ]);

        expect(changed).to.be.false;
        expect(instance.setForeignObjectAsync.called).to.be.false;
    });

    it('appends only the missing device and preserves existing entries (incl. overrides)', async () => {
        const existing = {
            name: 'Living Room',
            deviceId: 'aaa111',
            infoDustbox: '1',
            controlSpotAreaSync: 'fullSynchronization'
        };
        const obj = instanceObj([existing]);
        instance.getForeignObjectAsync = sinon.stub().resolves(obj);
        instance.setForeignObjectAsync = sinon.stub().resolves();

        const changed = await instance.ensureDeviceConfigEntries([
            { did: 'aaa111', nick: 'Living Room' },
            { did: 'bbb222', nick: 'Bedroom' }
        ]);

        expect(changed).to.be.true;
        const written = instance.setForeignObjectAsync.firstCall.args[1].native.devices;
        expect(written).to.have.lengthOf(2);
        // existing entry untouched, including the user's feature overrides
        expect(written[0]).to.deep.equal(existing);
        expect(written[1]).to.deep.equal({ name: 'Bedroom', deviceId: 'bbb222' });
    });

    it('treats raw and sanitized device ids as the same device (no duplicate)', async () => {
        // existing entry stores a sanitized id, the discovered did has the raw form
        const obj = instanceObj([{ name: 'Bot', deviceId: 'ab_cd_12' }]);
        instance.getForeignObjectAsync = sinon.stub().resolves(obj);
        instance.setForeignObjectAsync = sinon.stub().resolves();

        const changed = await instance.ensureDeviceConfigEntries([{ did: 'ab:cd-12', nick: 'Bot' }]);

        expect(changed).to.be.false;
        expect(instance.setForeignObjectAsync.called).to.be.false;
    });

    it('falls back through nick -> deviceName -> name -> did for the entry name', async () => {
        instance.getForeignObjectAsync = sinon.stub().resolves(instanceObj([]));
        instance.setForeignObjectAsync = sinon.stub().resolves();

        const changed = await instance.ensureDeviceConfigEntries([{ did: 'ccc333' }]);

        expect(changed).to.be.true;
        const written = instance.setForeignObjectAsync.firstCall.args[1].native.devices;
        expect(written[0]).to.deep.equal({ name: 'ccc333', deviceId: 'ccc333' });
    });

    it('returns false and does not throw when the instance object is missing', async () => {
        instance.getForeignObjectAsync = sinon.stub().resolves(null);
        instance.setForeignObjectAsync = sinon.stub().resolves();

        const changed = await instance.ensureDeviceConfigEntries([{ did: 'aaa111' }]);

        expect(changed).to.be.false;
        expect(instance.setForeignObjectAsync.called).to.be.false;
    });

    it('treats a missing native.devices array as empty and seeds it', async () => {
        const obj = instanceObj(undefined); // native = {}
        instance.getForeignObjectAsync = sinon.stub().resolves(obj);
        instance.setForeignObjectAsync = sinon.stub().resolves();

        const changed = await instance.ensureDeviceConfigEntries([{ did: 'aaa111', nick: 'Bot' }]);

        expect(changed).to.be.true;
        const written = instance.setForeignObjectAsync.firstCall.args[1].native.devices;
        expect(written).to.deep.equal([{ name: 'Bot', deviceId: 'aaa111' }]);
    });

    it('returns false and logs a warning when reading the object fails', async () => {
        instance.getForeignObjectAsync = sinon.stub().rejects(new Error('db down'));
        instance.setForeignObjectAsync = sinon.stub().resolves();

        const changed = await instance.ensureDeviceConfigEntries([{ did: 'aaa111' }]);

        expect(changed).to.be.false;
        expect(instance.setForeignObjectAsync.called).to.be.false;
        expect(instance.log.warn.called).to.be.true;
    });

    it('skips devices without a usable id', async () => {
        instance.getForeignObjectAsync = sinon.stub().resolves(instanceObj([]));
        instance.setForeignObjectAsync = sinon.stub().resolves();

        const changed = await instance.ensureDeviceConfigEntries([{ nick: 'No Id Device' }]);

        expect(changed).to.be.false;
        expect(instance.setForeignObjectAsync.called).to.be.false;
    });
});
