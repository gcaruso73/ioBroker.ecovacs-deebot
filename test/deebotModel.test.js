'use strict';

const { expect } = require('chai');
const { describe, it, beforeEach } = require('mocha');
const sinon = require('sinon');
const Model = require('../lib/deebotModel');

function createMockVacbot(overrides = {}) {
    return Object.assign({
        deviceClass: 'unknown_class',
        getPlatformType: sinon.stub().returns(''),
        getModelType: sinon.stub().returns(''),
        getDeviceCategory: sinon.stub().returns('Vacuum Cleaner'),
        getProductImageURL: sinon.stub().returns('http://example.com/image.png'),
        getProtocol: sinon.stub().returns('MQTT'),
        is950type: sinon.stub().returns(true),
        is950type_V2: sinon.stub().returns(false),
        hasMappingCapabilities: sinon.stub().returns(true),
        hasMainBrush: sinon.stub().returns(true),
        hasSideBrush: sinon.stub().returns(true),
        hasFilter: sinon.stub().returns(true),
        hasAirDrying: sinon.stub().returns(false),
        hasMoppingSystem: sinon.stub().returns(true),
        hasAdvancedMode: sinon.stub().returns(true),
        hasCustomAreaCleaningMode: sinon.stub().returns(true),
        isModelTypeN8: sinon.stub().returns(false),
        isModelTypeT8: sinon.stub().returns(false),
        isModelTypeT9: sinon.stub().returns(false),
        isModelTypeT10: sinon.stub().returns(false),
        isModelTypeT20: sinon.stub().returns(false),
        isModelTypeX1: sinon.stub().returns(false),
        isModelTypeX2: sinon.stub().returns(false),
        isModelTypeAirbot: sinon.stub().returns(false),
        isModelTypeAqMonitor: sinon.stub().returns(false),
        getDeviceProperty: sinon.stub().returns(false)
    }, overrides);
}

describe('deebotModel', () => {
    let mockVacbot;
    let model;

    beforeEach(() => {
        mockVacbot = createMockVacbot();
        model = new Model(mockVacbot, {});
    });

    describe('Hardware capabilities', () => {
        it('should correctly report getProductImageURL', () => {
            expect(model.getProductImageURL()).to.equal('http://example.com/image.png');
        });

        it('should correctly report getProtocol and uses(Xmpp|Mqtt)', () => {
            mockVacbot.getProtocol.returns('MQTT');
            expect(model.getProtocol()).to.equal('MQTT');
            expect(model.usesMqtt()).to.be.true;
            expect(model.usesXmpp()).to.be.false;

            mockVacbot.getProtocol.returns('XMPP');
            expect(model.usesXmpp()).to.be.true;
            expect(model.usesMqtt()).to.be.false;
        });

        it('should correctly report 950 types', () => {
            mockVacbot.is950type.returns(true);
            mockVacbot.is950type_V2.returns(false);
            expect(model.is950type()).to.be.true;
            expect(model.isNot950type()).to.be.false;
            expect(model.is950type_V2()).to.be.false;
            expect(model.isNot950type_V2()).to.be.true;
        });

        it('should report mapping capabilities', () => {
            mockVacbot.hasMappingCapabilities.returns(true);
            expect(model.isMappingSupported()).to.be.true;
            expect(model.hasMappingCapabilities()).to.be.true;

            mockVacbot.hasMappingCapabilities.returns(false);
            mockVacbot.isModelTypeAirbot.returns(true); // Airbot still returns true for hasMappingCapabilities in the model
            expect(model.isMappingSupported()).to.be.false;
            expect(model.hasMappingCapabilities()).to.be.true;
        });

        it('should report brushes and filters', () => {
            expect(model.hasMainBrush()).to.be.true;
            expect(model.hasSideBrush()).to.be.true;
            expect(model.hasFilter()).to.be.true;
        });

        it('should report air drying and cleaning station', () => {
            mockVacbot.hasAirDrying.returns(true);
            expect(model.hasAirDrying()).to.be.true;
            expect(model.hasCleaningStation()).to.be.true;
        });

        it('should report floor washing', () => {
            mockVacbot.hasMoppingSystem.returns(true);
            mockVacbot.hasAirDrying.returns(true); // implies cleaning station
            expect(model.hasFloorWashing()).to.be.true;

            mockVacbot.hasAirDrying.returns(false);
            expect(model.hasFloorWashing()).to.be.false;
            
            // Testing fallback if function doesn't exist
            delete mockVacbot.hasMoppingSystem;
            expect(model.hasFloorWashing()).to.be.false;
        });

        it('should report advanced modes', () => {
            expect(model.hasAdvancedMode()).to.be.true;
            expect(model.hasCustomAreaCleaningMode()).to.be.true;

            delete mockVacbot.hasAdvancedMode;
            expect(model.hasAdvancedMode()).to.be.false;

            delete mockVacbot.hasCustomAreaCleaningMode;
            expect(model.hasCustomAreaCleaningMode()).to.be.false;
        });
    });

    describe('Platform classification', () => {
        it('should report getPlatformType and getModelType', () => {
            mockVacbot.getPlatformType.returns('T8');
            expect(model.getPlatformType()).to.equal('T8');
            expect(model.getModelType()).to.equal('T8');

            const nullModel = new Model(null, {});
            expect(nullModel.getPlatformType()).to.equal('');
        });

        it('should report T8 based models', () => {
            mockVacbot.isModelTypeT8.returns(true);
            expect(model.isModelTypeT8Based()).to.be.true;
            expect(model.isModelTypeT8()).to.be.true;

            mockVacbot.isModelTypeT8.returns(false);
            mockVacbot.isModelTypeN8.returns(true);
            expect(model.isModelTypeT8Based()).to.be.true;
            expect(model.isModelTypeN8()).to.be.true;
        });

        it('should report T9 based models', () => {
            mockVacbot.isModelTypeT9.returns(true);
            expect(model.isModelTypeT9Based()).to.be.true;
            expect(model.isModelTypeT9()).to.be.true;

            mockVacbot.isModelTypeT9.returns(false);
            mockVacbot.isModelTypeT10.returns(true);
            expect(model.isModelTypeT9Based()).to.be.true;
            expect(model.isModelTypeT10()).to.be.true;

            mockVacbot.isModelTypeT10.returns(false);
            mockVacbot.isModelTypeT20.returns(true);
            expect(model.isModelTypeT9Based()).to.be.true;
            expect(model.isModelTypeT20()).to.be.true;

            mockVacbot.isModelTypeT20.returns(false);
            mockVacbot.isModelTypeX1.returns(true);
            expect(model.isModelTypeT9Based()).to.be.true;
            expect(model.isModelTypeX1()).to.be.true;

            mockVacbot.isModelTypeX1.returns(false);
            mockVacbot.isModelTypeX2.returns(true);
            expect(model.isModelTypeT9Based()).to.be.true;
            expect(model.isModelTypeX2()).to.be.true;
        });

        it('should report Airbot and AqMonitor', () => {
            mockVacbot.isModelTypeAirbot.returns(true);
            expect(model.isModelTypeAirbot()).to.be.true;

            mockVacbot.isModelTypeAqMonitor.returns(true);
            expect(model.isModelTypeAqMonitor()).to.be.true;
        });

        it('should report hasOtaSupport', () => {
            mockVacbot.isModelTypeAqMonitor.returns(false);
            expect(model.hasOtaSupport()).to.be.true;

            mockVacbot.isModelTypeAqMonitor.returns(true);
            expect(model.hasOtaSupport()).to.be.false;
        });
    });

    describe('State and feature support', () => {
        it('should return default states based on category', () => {
            mockVacbot.getDeviceCategory.returns('Vacuum Cleaner');
            expect(model._getDefaultStates()).to.include('control.cleanSpeed');

            mockVacbot.getDeviceCategory.returns('Air Purifier');
            expect(model._getDefaultStates()).to.include('control.volume');
            expect(model._getDefaultStates()).to.not.include('control.cleanSpeed');

            mockVacbot.getDeviceCategory.returns('Lawn Mower');
            expect(model._getDefaultStates()).to.include('info.sleepStatus');

            mockVacbot.getDeviceCategory.returns('Unknown Category');
            // Falls back to DEFAULT_STATES (Vacuum Cleaner)
            expect(model._getDefaultStates()).to.include('control.cleanSpeed');

            // if model is null
            const nullModel = new Model(null, {});
            expect(nullModel._getDefaultStates()).to.include('control.cleanSpeed');
        });

        it('should check config override', () => {
            model = new Model(mockVacbot, { 'feature.control.experimental': '1' });
            expect(model.getConfigOverride('control.goToPosition')).to.equal('1');
            expect(model.getConfigOverride('info.battery')).to.be.null;

            // Missing property in config
            model = new Model(mockVacbot, {});
            expect(model.getConfigOverride('control.goToPosition')).to.be.null;
        });

        it('should check supported features with fallback to default states', () => {
            // Unregistered device class
            mockVacbot.deviceClass = 'unknown_class';
            expect(model.isSupportedFeature('info.network')).to.be.true; // category default
            expect(model.isSupportedFeature('map.mapImage')).to.be.false; // not in category default

            // Config override
            model = new Model(mockVacbot, { 'feature.map.mapImage': '1' });
            expect(model.isSupportedFeature('map.mapImage')).to.be.true;

            model = new Model(mockVacbot, { 'feature.map.mapImage': '0' });
            expect(model.isSupportedFeature('map.mapImage')).to.be.false;
        });

        it('should lookup in SUPPORTED_STATES', () => {
            mockVacbot.deviceClass = 'yna5xi'; // DEEBOT OZMO 950 Series
            expect(model.lookupInSupportedStates('map')).to.be.true;
            expect(model.lookupInSupportedStates('map.mapImage')).to.be.true;
            expect(model.lookupInSupportedStates('unknown.feature')).to.be.undefined;

            // Follow canonical link
            mockVacbot.deviceClass = 'vi829v'; // DEEBOT OZMO 920, linked to yna5xi
            expect(model.lookupInSupportedStates('map.mapImage')).to.be.true;
            expect(model.lookupInSupportedStates('unknown.feature')).to.be.undefined;
        });

        it('should handle map implicit defaults', () => {
            mockVacbot.deviceClass = 'yna5xi'; // map: true in SUPPORTED_STATES
            expect(model.isSupportedFeature('map.spotAreas')).to.be.true; // from MAP_DEFAULT_STATES
            expect(model.isSupportedFeature('map.mapImage')).to.be.true; // explicit in SUPPORTED_STATES
        });

        it('should fetch device capabilities object', () => {
            mockVacbot.deviceClass = 'yna5xi';
            mockVacbot.hasMappingCapabilities.returns(true);
            mockVacbot.getDeviceCategory.returns('Vacuum Cleaner');
            mockVacbot.hasAirDrying.returns(false);
            mockVacbot.getDeviceProperty.returns(true); // yiko = true
            
            const caps = model.getDeviceCapabilities();
            expect(caps.type).to.equal('Vacuum Cleaner');
            expect(caps.hasMapping).to.be.true;
            expect(caps.hasAirDrying).to.be.false;
            expect(caps.hasVoiceAssistant).to.be.true;
            expect(caps.hasFloorWashing).to.be.false;
            expect(caps.hasSpotAreas).to.be.true;
        });
        
        it('should return generic getProductName for unknown device', () => {
             mockVacbot.deviceClass = 'unknown';
             expect(model.getProductName()).to.equal('unknown');
        });
    });
});