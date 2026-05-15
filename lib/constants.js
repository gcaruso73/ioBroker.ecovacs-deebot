'use strict';

module.exports = {
    CONNECT_COOLDOWN_MS: 30000,
    STARTUP_GRACE_PERIOD_MS: 5000,
    INITIAL_GET_COMMANDS_DELAY_MS: 6000,
    LAST_CHARGE_STATUS_RESET_DELAY_MS: 3000,
    POST_SETTING_DELAY_MS: 100,
    POSITION_THROTTLE_MS: 2000,
    COMMAND_FAILURE_RESET_TIMEOUT_MS: 60000,
    CONSECUTIVE_FAILURE_THRESHOLD: 2,
    RECOVERY_DEBOUNCE_MS: 5000,
    RECOVERY_REFETCH_DELAY_MS: 2000,
    ERROR_WRITE_DEBOUNCE_MS: 5000,
    RECONNECT_COOLDOWN_MS: 60000,
    /**
     * Coalesce 'ready' events from a vacbot that arrive close together.
     * The ecovacs-deebot library emits 'ready' on every successful MQTT
     * subscribe, including auto-reconnects, so the event can fire many
     * times in quick succession after a brief network blip. We treat a
     * second 'ready' arriving within this window as a no-op.
     */
    READY_DEBOUNCE_MS: 2000,
    AIR_DRYING_RESET_DELAY_MS: 60000,
    AIR_DRYING_INTERVAL_MS: 60000,
    DEVICE_CONNECTION_DELAY_MS: 30000,
    BACKOFF_SCHEDULE: [30000, 60000, 300000],
    MIN_POLLING_INTERVAL_MS: 60000,
    FORMATTED_DATE_THROTTLE_S: 60
};
