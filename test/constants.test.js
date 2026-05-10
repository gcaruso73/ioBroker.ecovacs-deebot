'use strict';

const { expect } = require('chai');
const { describe, it } = require('mocha');

const C = require('../lib/constants');

describe('constants.js', () => {
    it('INITIAL_GET_COMMANDS_DELAY_MS should be 6000', () => {
        expect(C.INITIAL_GET_COMMANDS_DELAY_MS).to.equal(6000);
    });

    it('LAST_CHARGE_STATUS_RESET_DELAY_MS should be 3000', () => {
        expect(C.LAST_CHARGE_STATUS_RESET_DELAY_MS).to.equal(3000);
    });

    it('POST_SETTING_DELAY_MS should be 100', () => {
        expect(C.POST_SETTING_DELAY_MS).to.equal(100);
    });

    it('POSITION_THROTTLE_MS should be 2000', () => {
        expect(C.POSITION_THROTTLE_MS).to.equal(2000);
    });

    it('COMMAND_FAILURE_RESET_TIMEOUT_MS should be 60000', () => {
        expect(C.COMMAND_FAILURE_RESET_TIMEOUT_MS).to.equal(60000);
    });

    it('CONSECUTIVE_FAILURE_THRESHOLD should be 2', () => {
        expect(C.CONSECUTIVE_FAILURE_THRESHOLD).to.equal(2);
    });

    it('RECOVERY_DEBOUNCE_MS should be 5000', () => {
        expect(C.RECOVERY_DEBOUNCE_MS).to.equal(5000);
    });

    it('RECOVERY_REFETCH_DELAY_MS should be 2000', () => {
        expect(C.RECOVERY_REFETCH_DELAY_MS).to.equal(2000);
    });

    it('ERROR_WRITE_DEBOUNCE_MS should be 5000', () => {
        expect(C.ERROR_WRITE_DEBOUNCE_MS).to.equal(5000);
    });

    it('RECONNECT_COOLDOWN_MS should be 60000', () => {
        expect(C.RECONNECT_COOLDOWN_MS).to.equal(60000);
    });

    it('AIR_DRYING_RESET_DELAY_MS should be 60000', () => {
        expect(C.AIR_DRYING_RESET_DELAY_MS).to.equal(60000);
    });

    it('AIR_DRYING_INTERVAL_MS should be 60000', () => {
        expect(C.AIR_DRYING_INTERVAL_MS).to.equal(60000);
    });

    it('BACKOFF_SCHEDULE should be [30000, 60000, 300000]', () => {
        expect(C.BACKOFF_SCHEDULE).to.deep.equal([30000, 60000, 300000]);
    });

    it('MIN_POLLING_INTERVAL_MS should be 60000', () => {
        expect(C.MIN_POLLING_INTERVAL_MS).to.equal(60000);
    });

    it('FORMATTED_DATE_THROTTLE_S should be 60', () => {
        expect(C.FORMATTED_DATE_THROTTLE_S).to.equal(60);
    });

    it('should have exactly 17 exported constants', () => {
        expect(Object.keys(C)).to.have.lengthOf(17);
    });

    it('all delay constants should be positive', () => {
        [
            'INITIAL_GET_COMMANDS_DELAY_MS', 'LAST_CHARGE_STATUS_RESET_DELAY_MS',
            'POST_SETTING_DELAY_MS', 'POSITION_THROTTLE_MS',
            'COMMAND_FAILURE_RESET_TIMEOUT_MS', 'RECOVERY_DEBOUNCE_MS',
            'RECOVERY_REFETCH_DELAY_MS', 'ERROR_WRITE_DEBOUNCE_MS',
            'RECONNECT_COOLDOWN_MS', 'AIR_DRYING_RESET_DELAY_MS',
            'AIR_DRYING_INTERVAL_MS', 'MIN_POLLING_INTERVAL_MS',
            'FORMATTED_DATE_THROTTLE_S'
        ].forEach(key => {
            expect(C[key], key + ' should be > 0').to.be.greaterThan(0);
        });
    });

    it('BACKOFF_SCHEDULE should have increasing values', () => {
        for (let i = 1; i < C.BACKOFF_SCHEDULE.length; i++) {
            expect(C.BACKOFF_SCHEDULE[i]).to.be.greaterThan(C.BACKOFF_SCHEDULE[i - 1]);
        }
    });
});
