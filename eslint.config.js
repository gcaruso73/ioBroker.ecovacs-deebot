'use strict';

const js = require('@eslint/js');
const globals = require('globals');

// Flat config (ESLint v9+). Ported from the former .eslintrc.json:
//   env es6/node/mocha, extends eslint:recommended, same explicit rules.
module.exports = [
    {
        ignores: ['node_modules/**', 'admin/**', '.nyc_output/**', 'coverage/**'],
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.mocha,
            },
        },
        rules: {
            indent: ['error', 4, { SwitchCase: 1 }],
            'no-console': 'off',
            'no-var': 'error',
            'prefer-const': 'error',
            quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
            semi: ['error', 'always'],
            // Callback signatures (e.g. command-registry handlers and event
            // handlers) carry positional args that aren't always used, and the
            // codebase deliberately uses best-effort `catch {}` cleanup blocks.
            // Still flags genuinely unused local variables and imports.
            'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
            'no-empty': ['error', { allowEmptyCatch: true }],
        },
    },
];
