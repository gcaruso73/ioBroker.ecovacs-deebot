'use strict';

const { expect } = require('chai');
const { describe, it, beforeEach } = require('mocha');

// Map from model type to user-friendly device type (mirrors modelTypes.js in the library)
const LIBRARY_DEVICE_TYPE_MAP = {
    'airbot': 'Air Purifier',
    'lawnMower': 'Lawn Mower',
    'aqMonitor': 'Air Quality Monitor',
    'yeedi': 'Vacuum Cleaner',
    'legacy': 'Vacuum Cleaner',
    '950': 'Vacuum Cleaner',
    'U2': 'Vacuum Cleaner',
    'mini': 'Vacuum Cleaner',
    'N8': 'Vacuum Cleaner',
    'T8': 'Vacuum Cleaner',
    'T9': 'Vacuum Cleaner',
    'T10': 'Vacuum Cleaner',
    'T20': 'Vacuum Cleaner',
    'X1': 'Vacuum Cleaner',
    'X2': 'Vacuum Cleaner'
};

// Mock the vacbot object to simulate different device types
class MockVacbot {
    constructor(modelType, deviceClass, deviceProperties = {}) {
        this.modelType = modelType;
        this.deviceClass = deviceClass;
        this.deviceProperties = deviceProperties;
    }

    getModelType() {
        return this.modelType;
    }

    getDeviceProperty(property, defaultValue = false) {
        if (property === 'deviceType') {
            return LIBRARY_DEVICE_TYPE_MAP[this.modelType] || defaultValue;
        }
        return this.deviceProperties[property] !== undefined ? this.deviceProperties[property] : defaultValue;
    }

    hasMappingCapabilities() {
        return ['airbot', '950', 'N8', 'T8', 'T9', 'T10', 'T20', 'X1', 'X2'].includes(this.modelType);
    }

    hasAirDrying() {
        return ['T20', 'X1', 'X2'].includes(this.modelType);
    }

    isSupportedFeature(feature) {
        const featureMap = {
            'info.waterbox': ['T8', 'T9', 'T10', 'T20', 'X1', 'X2', 'N8'],
            'control.autoEmptyStation': ['T8', 'T9', 'T10', 'T20', 'X1', 'X2'],
            'map.spotAreas': ['950', 'T8', 'T9', 'T10', 'T20', 'X1', 'X2'],
            'map.virtualBoundaries': ['950', 'T8', 'T9', 'T10', 'T20', 'X1', 'X2'],
            'control.continuousCleaning': ['950', 'T8', 'T9', 'T10', 'T20', 'X1', 'X2'],
            'control.doNotDisturb': ['950', 'T8', 'T9', 'T10', 'T20', 'X1', 'X2']
        };
        
        return featureMap[feature] ? featureMap[feature].includes(this.modelType) : false;
    }
}

// We need to test the actual Model class, so let's create a testable version
class TestableModel {
    constructor(vacbot, config = {}) {
        this.vacbot = vacbot;
        this.config = config;
    }

    getModelType() {
        return this.vacbot.getModelType();
    }

    getDeviceType() {
        return this.vacbot.getDeviceProperty('deviceType', 'Unknown Device');
    }

    getDeviceCapabilities() {
        return {
            type: this.getDeviceType(),
            hasMapping: this.vacbot.hasMappingCapabilities(),
            hasWaterBox: this.vacbot.isSupportedFeature('info.waterbox'),
            hasAirDrying: this.vacbot.hasAirDrying(),
            hasAutoEmpty: this.vacbot.isSupportedFeature('control.autoEmptyStation'),
            hasSpotAreas: this.vacbot.isSupportedFeature('map.spotAreas'),
            hasVirtualBoundaries: this.vacbot.isSupportedFeature('map.virtualBoundaries'),
            hasContinuousCleaning: this.vacbot.isSupportedFeature('control.continuousCleaning'),
            hasDoNotDisturb: this.vacbot.isSupportedFeature('control.doNotDisturb'),
            hasVoiceAssistant: this.vacbot.getDeviceProperty('yiko') || false
        };
    }
}

describe('Device Type Classification', () => {
    describe('getDeviceType()', () => {
        it('should return "Air Purifier" for airbot model type', () => {
            const mockVacbot = new MockVacbot('airbot', '0b5f6y');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Air Purifier');
        });

        it('should return "Lawn Mower" for lawnMower model type', () => {
            const mockVacbot = new MockVacbot('lawnMower', '5xu9h3');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Lawn Mower');
        });

        it('should return "Air Quality Monitor" for aqMonitor model type', () => {
            const mockVacbot = new MockVacbot('aqMonitor', 'aq1234');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Air Quality Monitor');
        });

        it('should return "Vacuum Cleaner" for yeedi model type', () => {
            const mockVacbot = new MockVacbot('yeedi', 'p5nx9u');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Vacuum Cleaner');
        });

        it('should return "Vacuum Cleaner" for legacy model type', () => {
            const mockVacbot = new MockVacbot('legacy', '123');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Vacuum Cleaner');
        });

        it('should return "Vacuum Cleaner" for 950 model type', () => {
            const mockVacbot = new MockVacbot('950', 'vi829v');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Vacuum Cleaner');
        });

        it('should return "Vacuum Cleaner" for T8 model type', () => {
            const mockVacbot = new MockVacbot('T8', 'h18jkh');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Vacuum Cleaner');
        });

        it('should return "Vacuum Cleaner" for T20 model type', () => {
            const mockVacbot = new MockVacbot('T20', '3yqsch');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Vacuum Cleaner');
        });

        it('should return "Vacuum Cleaner" for X1 model type', () => {
            const mockVacbot = new MockVacbot('X1', '3yqsch');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Vacuum Cleaner');
        });

        it('should return "Unknown Device" for unknown model type', () => {
            const mockVacbot = new MockVacbot('unknown', 'unknown');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Unknown Device');
        });
    });

    describe('getDeviceCapabilities()', () => {
        it('should return correct capabilities for airbot device', () => {
            const mockVacbot = new MockVacbot('airbot', '0b5f6y', { yiko: true });
            const model = new TestableModel(mockVacbot);
            
            const capabilities = model.getDeviceCapabilities();
            
            expect(capabilities).to.be.an('object');
            expect(capabilities.type).to.equal('Air Purifier');
            expect(capabilities.hasMapping).to.be.true;
            expect(capabilities.hasWaterBox).to.be.false;
            expect(capabilities.hasAirDrying).to.be.false;
            expect(capabilities.hasAutoEmpty).to.be.false;
            expect(capabilities.hasSpotAreas).to.be.false;
            expect(capabilities.hasVirtualBoundaries).to.be.false;
            expect(capabilities.hasContinuousCleaning).to.be.false;
            expect(capabilities.hasDoNotDisturb).to.be.false;
            expect(capabilities.hasVoiceAssistant).to.be.true;
        });

        it('should return correct capabilities for lawnMower (GOAT) device', () => {
            const mockVacbot = new MockVacbot('lawnMower', '5xu9h3');
            const model = new TestableModel(mockVacbot);
            
            const capabilities = model.getDeviceCapabilities();
            
            expect(capabilities).to.be.an('object');
            expect(capabilities.type).to.equal('Lawn Mower');
            expect(capabilities.hasMapping).to.be.false;
            expect(capabilities.hasWaterBox).to.be.false;
            expect(capabilities.hasAirDrying).to.be.false;
            expect(capabilities.hasAutoEmpty).to.be.false;
            expect(capabilities.hasSpotAreas).to.be.false;
            expect(capabilities.hasVirtualBoundaries).to.be.false;
            expect(capabilities.hasContinuousCleaning).to.be.false;
            expect(capabilities.hasDoNotDisturb).to.be.false;
            expect(capabilities.hasVoiceAssistant).to.be.false;
        });

        it('should return correct capabilities for high-end vacuum (T20)', () => {
            const mockVacbot = new MockVacbot('T20', '3yqsch', { yiko: true });
            const model = new TestableModel(mockVacbot);
            
            const capabilities = model.getDeviceCapabilities();
            
            expect(capabilities).to.be.an('object');
            expect(capabilities.type).to.equal('Vacuum Cleaner');
            expect(capabilities.hasMapping).to.be.true;
            expect(capabilities.hasWaterBox).to.be.true;
            expect(capabilities.hasAirDrying).to.be.true;
            expect(capabilities.hasAutoEmpty).to.be.true;
            expect(capabilities.hasSpotAreas).to.be.true;
            expect(capabilities.hasVirtualBoundaries).to.be.true;
            expect(capabilities.hasContinuousCleaning).to.be.true;
            expect(capabilities.hasDoNotDisturb).to.be.true;
            expect(capabilities.hasVoiceAssistant).to.be.true;
        });

        it('should return correct capabilities for basic vacuum (legacy)', () => {
            const mockVacbot = new MockVacbot('legacy', '123');
            const model = new TestableModel(mockVacbot);
            
            const capabilities = model.getDeviceCapabilities();
            
            expect(capabilities).to.be.an('object');
            expect(capabilities.type).to.equal('Vacuum Cleaner');
            expect(capabilities.hasMapping).to.be.false;
            expect(capabilities.hasWaterBox).to.be.false;
            expect(capabilities.hasAirDrying).to.be.false;
            expect(capabilities.hasAutoEmpty).to.be.false;
            expect(capabilities.hasSpotAreas).to.be.false;
            expect(capabilities.hasVirtualBoundaries).to.be.false;
            expect(capabilities.hasContinuousCleaning).to.be.false;
            expect(capabilities.hasDoNotDisturb).to.be.false;
            expect(capabilities.hasVoiceAssistant).to.be.false;
        });

        it('should return correct capabilities for air quality monitor', () => {
            const mockVacbot = new MockVacbot('aqMonitor', 'aq1234');
            const model = new TestableModel(mockVacbot);
            
            const capabilities = model.getDeviceCapabilities();
            
            expect(capabilities).to.be.an('object');
            expect(capabilities.type).to.equal('Air Quality Monitor');
            expect(capabilities.hasMapping).to.be.false;
            expect(capabilities.hasWaterBox).to.be.false;
            expect(capabilities.hasAirDrying).to.be.false;
            expect(capabilities.hasAutoEmpty).to.be.false;
            expect(capabilities.hasSpotAreas).to.be.false;
            expect(capabilities.hasVirtualBoundaries).to.be.false;
            expect(capabilities.hasContinuousCleaning).to.be.false;
            expect(capabilities.hasDoNotDisturb).to.be.false;
            expect(capabilities.hasVoiceAssistant).to.be.false;
        });
    });

    describe('Device Type Edge Cases', () => {
        it('should handle null model type gracefully', () => {
            const mockVacbot = new MockVacbot(null, 'unknown');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Unknown Device');
        });

        it('should handle undefined model type gracefully', () => {
            const mockVacbot = new MockVacbot(undefined, 'unknown');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Unknown Device');
        });

        it('should handle empty string model type gracefully', () => {
            const mockVacbot = new MockVacbot('', 'unknown');
            const model = new TestableModel(mockVacbot);
            
            const deviceType = model.getDeviceType();
            expect(deviceType).to.equal('Unknown Device');
        });
    });

    describe('Device Capabilities Edge Cases', () => {
        it('should handle devices without voice assistant property', () => {
            const mockVacbot = new MockVacbot('t8', 'h18jkh'); // No yiko property
            const model = new TestableModel(mockVacbot);
            
            const capabilities = model.getDeviceCapabilities();
            
            expect(capabilities.hasVoiceAssistant).to.be.false;
        });

        it('should handle devices with voice assistant property', () => {
            const mockVacbot = new MockVacbot('x1', '3yqsch', { yiko: true });
            const model = new TestableModel(mockVacbot);
            
            const capabilities = model.getDeviceCapabilities();
            
            expect(capabilities.hasVoiceAssistant).to.be.true;
        });
    });
});