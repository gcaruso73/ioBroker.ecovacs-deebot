'use strict';

const { expect } = require('chai');
const { describe, it } = require('mocha');

const C = require('../lib/constants');

/**
 * constants.test.js
 *
 * Tests focus on *invariants*, not exact values:
 *  - All delay/timeout constants must be positive numbers
 *  - The backoff schedule must be a strictly increasing array
 *  - Threshold and count constants must be positive integers
 *  - READY_DEBOUNCE_MS must exist and be positive (consumed by parallel-init-prevention tests)
 *
 * Exact millisecond values are NOT tested here because they are tuning parameters
 * that may legitimately change without altering any observable behaviour.
 */

describe('constants.js', () => {
    const DELAY_KEYS = [
        'INITIAL_GET_COMMANDS_DELAY_MS',
        'LAST_CHARGE_STATUS_RESET_DELAY_MS',
        'POST_SETTING_DELAY_MS',
        'POSITION_THROTTLE_MS',
        'COMMAND_FAILURE_RESET_TIMEOUT_MS',
        'RECOVERY_DEBOUNCE_MS',
        'RECOVERY_REFETCH_DELAY_MS',
        'ERROR_WRITE_DEBOUNCE_MS',
        'RECONNECT_COOLDOWN_MS',
        'AIR_DRYING_RESET_DELAY_MS',
        'AIR_DRYING_INTERVAL_MS',
        'MIN_POLLING_INTERVAL_MS',
        'READY_DEBOUNCE_MS'
    ];

    describe('all timing constants', () => {
        it('should be positive numbers', () => {
            for (const key of DELAY_KEYS) {
                expect(C[key], key).to.be.a('number').and.to.be.greaterThan(0);
            }
        });

        it('FORMATTED_DATE_THROTTLE_S should be a positive number (seconds unit)', () => {
            expect(C.FORMATTED_DATE_THROTTLE_S).to.be.a('number').and.to.be.greaterThan(0);
        });
    });

    describe('BACKOFF_SCHEDULE', () => {
        it('should be a non-empty array', () => {
            expect(C.BACKOFF_SCHEDULE).to.be.an('array').with.length.greaterThan(0);
        });

        it('should contain only positive numbers', () => {
            C.BACKOFF_SCHEDULE.forEach((v, i) => {
                expect(v, `BACKOFF_SCHEDULE[${i}]`).to.be.a('number').and.to.be.greaterThan(0);
            });
        });

        it('should be strictly increasing (longer retries as backoff progresses)', () => {
            for (let i = 1; i < C.BACKOFF_SCHEDULE.length; i++) {
                expect(C.BACKOFF_SCHEDULE[i], `slot ${i} > slot ${i - 1}`)
                    .to.be.greaterThan(C.BACKOFF_SCHEDULE[i - 1]);
            }
        });
    });

    describe('threshold constants', () => {
        it('CONSECUTIVE_FAILURE_THRESHOLD should be a positive integer', () => {
            expect(C.CONSECUTIVE_FAILURE_THRESHOLD).to.be.a('number')
                .and.to.satisfy(n => Number.isInteger(n) && n > 0, 'positive integer');
        });
    });

    describe('module shape', () => {
        it('should export only numbers and arrays (no accidental string/object exports)', () => {
            for (const [key, value] of Object.entries(C)) {
                expect(value, `export "${key}"`).to.satisfy(
                    v => typeof v === 'number' || Array.isArray(v),
                    'must be a number or array'
                );
            }
        });

        it('should have READY_DEBOUNCE_MS (required by parallel-init-prevention)', () => {
            expect(C).to.have.property('READY_DEBOUNCE_MS').that.is.a('number').and.greaterThan(0);
        });

        it('should have INITIAL_GET_COMMANDS_DELAY_MS (required by parallel-init-prevention)', () => {
            expect(C).to.have.property('INITIAL_GET_COMMANDS_DELAY_MS').that.is.a('number').and.greaterThan(0);
        });
    });
});
