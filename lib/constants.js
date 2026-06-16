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
    AIR_DRYING_RESET_DELAY_MS: 60000,
    AIR_DRYING_INTERVAL_MS: 60000,
    DEVICE_CONNECTION_DELAY_MS: 30000,
    BACKOFF_SCHEDULE: [30000, 60000, 300000],
    MIN_POLLING_INTERVAL_MS: 60000,
    FORMATTED_DATE_THROTTLE_S: 60,

    /**
     * Request budget — the steady-state cloud-request rate limit.
     *
     * Two independent mechanisms pace outgoing commands; this is the *hard*
     * one. Ecovacs throttles / temporarily locks accounts on aggressive
     * request rates, so the budget is deliberately conservative:
     *
     *   - `RequestThrottle` (the hard cap): REQUEST_THROTTLE_MAX_PER_DEVICE
     *     requests per REQUEST_THROTTLE_WINDOW_MS, shared across all devices
     *     of the account but scaled by device count (see main.js connect() —
     *     `maxRequests = devices * REQUEST_THROTTLE_MAX_PER_DEVICE`), so each
     *     device keeps its own ~10-per-30s allowance.
     *   - The per-queue inter-command delay (`Queue.timeoutValue`, 500ms for
     *     commandQueue / 1000ms for intervalQueue): a softer *pacing* delay
     *     that smooths ordering and load. It implies ~2 req/s, but the
     *     throttle (~0.33 req/s sustained per device) is the binding
     *     constraint, so it dominates large bursts.
     *
     * Consequence: a startup burst (addInitialGetCommands + addStandardGetCommands
     * enqueue ~20-30 commands) is throttle-bound — the first ~10 go quickly,
     * the rest drain at roughly one per (window / max) seconds, so full initial
     * state population can take up to a couple of minutes. This is intended:
     * correctness/lock-avoidance over startup speed. Raise the budget only with
     * real-device verification that Ecovacs does not rate-limit the account.
     */
    REQUEST_THROTTLE_MAX_PER_DEVICE: 10,
    REQUEST_THROTTLE_WINDOW_MS: 30000
};
