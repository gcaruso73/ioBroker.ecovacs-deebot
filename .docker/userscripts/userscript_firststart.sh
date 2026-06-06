#!/bin/bash

echo "========================================================="
echo "=== Starting ioBroker.ecovacs-deebot Autoinstallation ==="
echo "========================================================="

# Scenario 1: Adapter source mounted or copied to /opt/iobroker.ecovacs-deebot
if [ -d "/opt/iobroker.ecovacs-deebot" ]; then
    echo "Found adapter source at /opt/iobroker.ecovacs-deebot"
    
    # Navigate to ioBroker installation directory
    cd /opt/iobroker
    
    # Install the adapter locally via npm as a copy (using --install-links to avoid symlink issues)
    echo "Installing adapter using --install-links..."
    npm install /opt/iobroker.ecovacs-deebot --install-links --production --unsafe-perm
    
    # Upload/Register the adapter in ioBroker
    echo "Uploading adapter to ioBroker..."
    iobroker upload ecovacs-deebot
    
    # Add an instance of the adapter and enable it
    echo "Adding adapter instance..."
    iobroker add ecovacs-deebot 0 --enabled
    
    echo "=== ioBroker.ecovacs-deebot installation finished! ==="

# Scenario 2: Adapter source mounted directly to node_modules (e.g., for direct development)
elif [ -d "/opt/iobroker/node_modules/iobroker.ecovacs-deebot" ]; then
    echo "Found adapter source mounted directly to node_modules"
    
    cd /opt/iobroker/node_modules/iobroker.ecovacs-deebot
    echo "Running npm install inside node_modules/iobroker.ecovacs-deebot..."
    npm install --production --unsafe-perm
    
    cd /opt/iobroker
    echo "Uploading adapter to ioBroker..."
    iobroker upload ecovacs-deebot
    
    echo "Adding adapter instance..."
    iobroker add ecovacs-deebot 0 --enabled
    
    echo "=== ioBroker.ecovacs-deebot installation finished! ==="

else
    echo "ERROR: Adapter source not found at /opt/iobroker.ecovacs-deebot or node_modules!"
fi

echo "========================================================="
