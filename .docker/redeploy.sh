#!/bin/bash
#
# Re-deploy the mounted adapter source into the running ioBroker container.
#
# The first-start userscript (userscript_firststart.sh) installs the adapter
# into node_modules ONCE. Re-running "npm install <path>" does NOT pick up later
# edits, because the package version is unchanged and npm treats it as already
# installed. So this script copies the changed source files directly into the
# installed copy, then re-uploads the admin/config files.
#
# Run it from the HOST with:  npm run docker:deploy
# (which execs this script inside the container), or directly inside the
# container with:  bash /opt/iobroker.ecovacs-deebot/.docker/redeploy.sh
#
set -e

SRC="/opt/iobroker.ecovacs-deebot"
DEST="/opt/iobroker/node_modules/iobroker.ecovacs-deebot"

echo "========================================================="
echo "=== Re-deploying iobroker.ecovacs-deebot ==============="
echo "========================================================="

if [ ! -d "$SRC" ]; then
    echo "ERROR: adapter source not found at $SRC (is the volume mounted?)"
    exit 1
fi
if [ ! -d "$DEST" ]; then
    echo "ERROR: installed adapter not found at $DEST (run the container's first start first)"
    exit 1
fi

# Copy the source paths that actually change during development into the
# installed copy. node_modules inside $DEST is left untouched, so production
# dependencies installed at first start are preserved.
echo "--- Syncing source files into $DEST ---"
for dir in lib admin; do
    if [ -d "$SRC/$dir" ]; then
        rm -rf "${DEST:?}/$dir"
        cp -a "$SRC/$dir" "$DEST/"
        echo "    synced $dir/"
    fi
done
for file in main.js io-package.json package.json; do
    if [ -f "$SRC/$file" ]; then
        cp -a "$SRC/$file" "$DEST/"
        echo "    synced $file"
    fi
done

echo "--- Uploading admin / config files into the objects DB ---"
cd /opt/iobroker
iobroker upload ecovacs-deebot

echo "--- Restarting instance ecovacs-deebot.0 ---"
iobroker restart ecovacs-deebot.0 || iobroker start ecovacs-deebot.0

echo "========================================================="
echo "=== Done. Hard-refresh the admin UI (Ctrl+Shift+R). ==="
echo "========================================================="
