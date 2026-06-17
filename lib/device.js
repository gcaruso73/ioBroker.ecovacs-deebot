'use strict';

const helper = require('./adapterHelper');

class Device {
    constructor(ctx) {
        this.ctx = ctx;
        this.adapter = ctx.adapter;
        this.status = null;
        this.cleanStatus = null;
        this.chargeStatus = null;
        this.batteryLevel = null;
    }

    /**
     * Set the status of the vacuum cleaner
     * @param {string} status
     */
    setStatus(status) {
        this.status = status;
        this.ctx.adapter.log.debug(`[setStatus] status = '${this.status}' (cleanStatus = '${this.cleanStatus}', chargeStatus = '${this.chargeStatus}')`);
    }

    /**
     * Set the battery level
     * @param {number} batteryLevel
     */
    setBatteryLevel(batteryLevel) {
        this.batteryLevel = batteryLevel;
    }

    setStatusByTrigger(trigger) {
        this.ctx.adapter.log.debug(`[setStatusByTrigger] trigger = '${trigger}'`);
        this.cleanStatus = this.ctx.cleanstatus;
        this.chargeStatus = this.ctx.chargestatus;
        if ((this.cleanStatus === 'idle') && (this.chargeStatus === 'idle')) {
            this.setStatus(helper.getDeviceStatusByStatus('stop'));
        } else if ((this.cleanStatus === 'stop') && (this.chargeStatus === 'charging')) {
            this.setStatus(helper.getDeviceStatusByStatus('charging'));
        } else if ((trigger === 'cleanstatus') && (this.cleanStatus !== 'idle')) {
            this.setStatus(helper.getDeviceStatusByStatus(this.cleanStatus));
        } else if ((trigger === 'chargestatus') && (this.chargeStatus !== 'idle')) {
            this.setStatus(helper.getDeviceStatusByStatus(this.chargeStatus));
        } else if ((this.chargeStatus === 'charging') && (this.cleanStatus === 'idle')) {
            this.setStatus(helper.getDeviceStatusByStatus('charging'));
        } else {
            this.setStatus(helper.getDeviceStatusByStatus(this.cleanStatus));
        }
    }

    /**
     * Returns whether the robot is currently performing a cleaning operation
     * @returns {Boolean} whether the status is equal to 'cleaning'
     */
    isCleaning() {
        return this.status === 'cleaning';
    }

    /**
     * Returns whether the robot is currently not performing a cleaning operation
     * @returns {Boolean} A boolean value
     */
    isNotCleaning() {
        return this.isCleaning() === false;
    }

    /**
     * Returns whether the robot is currently returning to the charging dock
     * @returns {Boolean} whether the status is equal to 'returning'
     */
    isReturning() {
        return this.status === 'returning';
    }

    /**
     * Returns whether the robot is currently not returning to the dock
     * @returns {Boolean} A boolean value
     */
    isNotReturning() {
        return this.isReturning() === false;
    }

    /**
     * Returns whether the robot is currently charging or docked to the charging station
     * @returns {Boolean} whether the status is equal to 'charging'
     */
    isCharging() {
        return this.status === 'charging';
    }

    /**
     * Returns whether the robot is currently not charging
     * @returns {Boolean} whether the status is not equal to 'charging'
     */
    isNotCharging() {
        return this.isCharging() === false;
    }

    /**
     * Returns whether the robot is currently paused
     * @returns {Boolean} whether the status is equal to 'paused'
     */
    isPaused() {
        return this.status === 'paused';
    }

    /**
     * Returns whether the robot is currently not paused
     * @returns {Boolean} whether the status is not equal to 'paused'
     */
    isNotPaused() {
        return this.isPaused() === false;
    }

    /**
     * Returns whether the robot is currently stopped
     * @returns {Boolean} whether the status is equal to 'stopped'
     */
    isStopped() {
        return this.status === 'stopped';
    }

    /**
     * Returns whether the robot is currently not paused
     * @returns {Boolean} whether the status is not equal to 'paused'
     */
    isNotStopped() {
        return this.isStopped() === false;
    }

    /**
     * Returns whether the robot is not paused or stopped
     * @returns {Boolean} A boolean value
     */
    isNotPausedOrStopped() {
        return (this.isPaused() === false) && (this.isStopped() === false);
    }

    useV2commands() {
        const configValue = this.ctx.adapter.getConfigValue('feature.control.v2commands', this.ctx.deviceId);
        if (configValue === '') {
            return this.ctx.getModel().is950type_V2();
        }
        return !!Number(configValue);
    }

    useNativeGoToPosition() {
        const configValue = this.ctx.adapter.getConfigValue('feature.control.nativeGoToPosition', this.ctx.deviceId);
        if (configValue === '') {
            return this.useV2commands();
        }
        return !!Number(configValue);
    }
}

module.exports = Device;
