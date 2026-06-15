'use strict';

const { expect } = require('chai');
const { describe, it } = require('mocha');
const fs = require('fs');
const path = require('path');

describe('Memory Leak Detection Tests', () => {

    describe('All leaks must be fixed before release', () => {
        it('should have NO memory leaks', () => {
            const mainSource = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

            // Extract onUnload body
            const onUnloadIdx = mainSource.indexOf('onUnload(callback)');
            const afterUnload = mainSource.substring(onUnloadIdx);
            const onUnloadEndIdx = afterUnload.indexOf('\n    async onMessage(');
            const onUnloadBody = onUnloadEndIdx > 0 ? afterUnload.substring(0, onUnloadEndIdx) : afterUnload;

            // Extract reconnect body
            const reconnectIdx = mainSource.indexOf('reconnect() {');
            const afterReconnect = mainSource.substring(reconnectIdx);
            const reconnectEndIdx = afterReconnect.indexOf('\n    async connect()');
            const reconnectBody = reconnectEndIdx > 0 ? afterReconnect.substring(0, reconnectEndIdx) : afterReconnect;

            const leaks = [];

            // Check #1: onUnload must call removeAllListeners
            if (!onUnloadBody.includes('removeAllListeners')) {
                leaks.push('LEAK #1: onUnload() missing vacbot.removeAllListeners()');
            }

            // Check #2: reconnect must clean intervals (either directly or via stopPolling)
            const hasGetGetPos = reconnectBody.includes('getGetPosInterval');
            const hasAirDrying = reconnectBody.includes('airDryingActiveInterval');
            // _autoUpdateInterval can be cleaned via stopPolling() call
            const hasAutoUpdate = reconnectBody.includes('_autoUpdateInterval') || reconnectBody.includes('stopPolling');
            if (!hasGetGetPos) {
                leaks.push('LEAK #2a: reconnect() missing getGetPosInterval cleanup');
            }
            if (!hasAirDrying) {
                leaks.push('LEAK #2b: reconnect() missing airDryingActiveInterval cleanup');
            }
            if (!hasAutoUpdate) {
                leaks.push('LEAK #2c: reconnect() missing _autoUpdateInterval cleanup');
            }

            // Check #3: onUnload must clean commandFailedResetTimeout
            if (!onUnloadBody.includes('commandFailedResetTimeout')) {
                leaks.push('LEAK #3: onUnload() missing commandFailedResetTimeout cleanup');
            }

            expect(leaks, 'ALL memory leaks must be fixed before release:\n  ' + leaks.join('\n  ')).to.be.empty;
        });
    });
});
