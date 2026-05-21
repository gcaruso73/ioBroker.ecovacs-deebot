'use strict';

const { expect } = require('chai');
const { describe, it } = require('mocha');
const sinon = require('sinon');
const Model = require('../lib/deebotModel');

/**
 * Create a realistic mock vacbot for a given device class and model type.
 */
function createMockVacbot(deviceClass, modelType, overrides = {}) {
    return Object.assign({
        deviceClass,
        getModelType: sinon.stub().returns(modelType),
        hasMappingCapabilities: sinon.stub().returns(true),
        hasAirDrying: sinon.stub().returns(false),
        hasMoppingSystem: sinon.stub().returns(true),
        hasMainBrush: sinon.stub().returns(true),
        hasFilter: sinon.stub().returns(true),
        hasSideBrush: sinon.stub().returns(true),
        hasAdvancedMode: sinon.stub().returns(true),
        hasCustomAreaCleaningMode: sinon.stub().returns(true),
        is950type: sinon.stub().returns(true),
        is950type_V2: sinon.stub().returns(false),
        isModelTypeN8: sinon.stub().returns(false),
        isModelTypeT8: sinon.stub().returns(false),
        isModelTypeT9: sinon.stub().returns(false),
        isModelTypeT10: sinon.stub().returns(modelType === 'T10'),
        isModelTypeT20: sinon.stub().returns(false),
        isModelTypeX1: sinon.stub().returns(false),
        isModelTypeX2: sinon.stub().returns(false),
        isModelTypeAirbot: sinon.stub().returns(false),
        getDeviceProperty: sinon.stub().returns(false),
        getProtocol: sinon.stub().returns('MQTT'),
        getProductImageURL: sinon.stub().returns(''),
        hasSpotAreaCleaningMode: sinon.stub().returns(true)
    }, overrides);
}

describe('Missing device class support in SUPPORTED_STATES', () => {
    describe('p95mgv (DEEBOT T10 PLUS)', () => {
        const deviceClass = 'p95mgv';
        const modelType = 'T10';

        it('should resolve product name via deviceClassLink', () => {
            const vacbot = createMockVacbot(deviceClass, modelType);
            const model = new Model(vacbot, {});
            expect(model.getProductName()).to.equal('DEEBOT T10 PLUS');
        });
    });

    describe('20anby (Z1 Air Quality Monitor)', () => {
        const deviceClass = '20anby';
        const modelType = 'aqMonitor';

        it('should resolve product name', () => {
            const vacbot = createMockVacbot(deviceClass, modelType);
            const model = new Model(vacbot, {});
            expect(model.getProductName()).to.equal('Z1 Air Quality Monitor');
        });
    });

    describe('9eamof (DEEBOT T80 OMNI)', () => {
        const deviceClass = '9eamof';
        const modelType = 'T10';

        it('should resolve product name via deviceClassLink', () => {
            const vacbot = createMockVacbot(deviceClass, modelType);
            const model = new Model(vacbot, {});
            expect(model.getProductName()).to.equal('DEEBOT T80 OMNI');
        });
    });

    describe('p1jij8 (DEEBOT T20 OMNI)', () => {
        const deviceClass = 'p1jij8';
        const modelType = 'T20';

        it('should resolve product name via deviceClassLink', () => {
            const vacbot = createMockVacbot(deviceClass, modelType, {
                isModelTypeT20: sinon.stub().returns(true)
            });
            const model = new Model(vacbot, {});
            expect(model.getProductName()).to.equal('DEEBOT T20 OMNI');
        });
    });


    describe('sdp1y1 (AIRBOT Z1)', () => {
        const deviceClass = 'sdp1y1';
        const modelType = 'airbot';

        it('should resolve product name via deviceClassLink', () => {
            const vacbot = createMockVacbot(deviceClass, modelType, {
                isModelTypeAirbot: sinon.stub().returns(true),
                hasMappingCapabilities: sinon.stub().returns(true),
                is950type: sinon.stub().returns(false)
            });
            const model = new Model(vacbot, {});
            expect(model.getProductName()).to.equal('AIRBOT Z1');
        });
    });

    describe('xmp9ds (GOAT A1600 RTK)', () => {
        const deviceClass = 'xmp9ds';
        const modelType = 'goat';

        it('should resolve product name via deviceClassLink', () => {
            const vacbot = createMockVacbot(deviceClass, modelType, {
                hasMappingCapabilities: sinon.stub().returns(false),
                hasMoppingSystem: sinon.stub().returns(false),
                is950type: sinon.stub().returns(false)
            });
            const model = new Model(vacbot, {});
            expect(model.getProductName()).to.equal('GOAT A1600 RTK');
        });
    });
});
