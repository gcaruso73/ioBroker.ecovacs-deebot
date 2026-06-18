'use strict';

/*
 * Keeps io-package.json's `common.version` in sync with package.json's `version`.
 *
 * Runs automatically as the npm `version` lifecycle hook, so
 * `npm version <patch|minor|major>` updates both files (and stages
 * io-package.json) in the same version-bump commit. This removes the
 * hand-sync footgun where the two versions could silently drift.
 *
 * Only the `common.version` value is rewritten via a targeted text
 * replacement; the rest of the file (formatting, `news`, unicode) is left
 * byte-for-byte untouched.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');
const ioPkgPath = path.join(rootDir, 'io-package.json');

const version = require(pkgPath).version;
if (!version) {
    console.error('sync-io-package-version: no version found in package.json');
    process.exit(1);
}

const original = fs.readFileSync(ioPkgPath, 'utf8');

// Replace only the first `"version": "..."` — that is `common.version`,
// the first/second child of the leading `common` block.
let replaced = false;
const updated = original.replace(/("version":\s*")[^"]*(")/, (match, prefix, suffix) => {
    replaced = true;
    return `${prefix}${version}${suffix}`;
});

if (!replaced) {
    console.error('sync-io-package-version: could not find a "version" field in io-package.json');
    process.exit(1);
}

if (updated !== original) {
    fs.writeFileSync(ioPkgPath, updated);
    console.log(`sync-io-package-version: io-package.json common.version → ${version}`);
} else {
    console.log(`sync-io-package-version: io-package.json already at ${version}`);
}
