'use strict';

function createRegistry() {
    const registry = new Map();
    return {
        register(key, handler) {
            registry.set(key, handler);
        },
        get(key) {
            return registry.get(key);
        },
        getAll() {
            return registry;
        }
    };
}

module.exports = { createRegistry };
