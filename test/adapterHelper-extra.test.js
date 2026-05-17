'use strict';

const { expect } = require('chai');
const { describe, it } = require('mocha');
const sinon = require('sinon');

const adapterHelper = require('../lib/adapterHelper');

describe('adapterHelper.js - extended edge cases', () => {
    describe('getDeviceStatusByStatus', () => {
        it('should map "pause" to "paused"', () => {
            expect(adapterHelper.getDeviceStatusByStatus('pause')).to.equal('paused');
        });

        it('should map "alert" to "error"', () => {
            expect(adapterHelper.getDeviceStatusByStatus('alert')).to.equal('error');
        });

        it('should map "move" to "moving"', () => {
            expect(adapterHelper.getDeviceStatusByStatus('move')).to.equal('moving');
        });

        it('should map all cleaning statuses', () => {
            ['area', 'edge', 'entrust', 'freeClean', 'qcClean', 'singlePoint', 'single_room'].forEach(s => {
                expect(adapterHelper.getDeviceStatusByStatus(s)).to.equal('cleaning');
            });
        });

        it('should return input for unknown statuses (default)', () => {
            expect(adapterHelper.getDeviceStatusByStatus('custom')).to.equal('custom');
            expect(adapterHelper.getDeviceStatusByStatus('comeClean')).to.equal('comeClean');
            expect(adapterHelper.getDeviceStatusByStatus('setLocation')).to.equal('setLocation');
        });
    });

    describe('getTimeStringFormatted', () => {
        it('should handle fractional seconds', () => {
            expect(adapterHelper.getTimeStringFormatted(3661.7)).to.equal('1h 01m 01s');
        });

        it('should format exactly one hour', () => {
            expect(adapterHelper.getTimeStringFormatted(3600)).to.equal('1h 00m 00s');
        });

        it('should format exactly one minute', () => {
            expect(adapterHelper.getTimeStringFormatted(60)).to.equal('0h 01m 00s');
        });
    });

    describe('getCurrentDateAndTimeFormatted', () => {
        it('should call formatDate with Date and correct format', () => {
            const adapter = { formatDate: sinon.stub().returns('2024.06.15 14:30:00') };
            const result = adapterHelper.getCurrentDateAndTimeFormatted(adapter);
            expect(result).to.equal('2024.06.15 14:30:00');
            expect(adapter.formatDate.calledWith(sinon.match.instanceOf(Date), 'TT.MM.JJJJ SS:mm:ss')).to.be.true;
        });
    });

    describe('areaValueStringWithCleaningsIsValid', () => {
        it('should validate with decimal values', () => {
            expect(adapterHelper.areaValueStringWithCleaningsIsValid('100.5,200.5,300.5,400.5,1')).to.be.true;
        });

        it('should reject negative cleaning count', () => {
            expect(adapterHelper.areaValueStringWithCleaningsIsValid('100,200,300,400,-1')).to.be.false;
        });

        it('should reject cleaning count > 2', () => {
            expect(adapterHelper.areaValueStringWithCleaningsIsValid('100,200,300,400,3')).to.be.false;
        });
    });

    describe('ID extraction with deeper nesting', () => {
        it('getSubChannelNameById should handle 6 parts', () => {
            expect(adapterHelper.getSubChannelNameById('a.b.c.d.e.f')).to.equal('e');
        });

        it('getStateNameById should handle 6 parts', () => {
            expect(adapterHelper.getStateNameById('a.b.c.d.e.f')).to.equal('f');
        });
    });
});
