#!/bin/bash

echo "========================================================="
echo "=== Starting ioBroker.ecovacs-deebot Autoinstallation ==="
echo "========================================================="

# Function to add, configure, and start the adapter instance
configure_and_start_instance() {
    # Add an instance of the adapter
    echo "Adding adapter instance..."
    iobroker add ecovacs-deebot 0
    
    # Configure the adapter if env vars are present
    if [ -n "$ECOVACS_EMAIL" ] || [ -n "$ECOVACS_PASSWORD" ] || [ -n "$ECOVACS_COUNTRY" ]; then
        echo "Configuring adapter instance from environment variables..."
        node -e '
            const execSync = require("child_process").execSync;
            const patch = { native: {} };
            if (process.env.ECOVACS_EMAIL) patch.native.email = process.env.ECOVACS_EMAIL;
            if (process.env.ECOVACS_PASSWORD) {
                let password = process.env.ECOVACS_PASSWORD;
                try {
                    const systemConfig = JSON.parse(execSync("iobroker object get system.config").toString());
                    const secret = systemConfig.native && systemConfig.native.secret;
                    if (secret && !password.startsWith("$/aes-192-cbc:")) {
                        const tools = require("/opt/iobroker/node_modules/iobroker.js-controller/build/cjs/lib/tools.js").default;
                        if (tools && typeof tools.encrypt === "function") {
                            password = tools.encrypt(secret, password);
                            console.log("Password encrypted successfully");
                        }
                    }
                } catch (err) {
                    console.warn("Failed to encrypt password, using plain text:", err.message);
                }
                patch.native.password = password;
            }
            if (process.env.ECOVACS_COUNTRY) patch.native.countrycode = process.env.ECOVACS_COUNTRY.toLowerCase();
            
            const patchStr = JSON.stringify(patch);
            console.log("Applying config patch:", patchStr);
            try {
                execSync(`iobroker object extend system.adapter.ecovacs-deebot.0 ${JSON.stringify(patchStr)}`, { stdio: "inherit" });
            } catch (err) {
                console.error("Failed to apply configuration:", err);
                process.exit(1);
            }
        '
    fi
    
    # Start and enable the adapter instance
    echo "Enabling and starting adapter instance..."
    iobroker set ecovacs-deebot.0 --enabled true
    iobroker start ecovacs-deebot.0
}

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
    
    # Configure and start instance
    configure_and_start_instance
    
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
    
    # Configure and start instance
    configure_and_start_instance
    
    echo "=== ioBroker.ecovacs-deebot installation finished! ==="

else
    echo "ERROR: Adapter source not found at /opt/iobroker.ecovacs-deebot or node_modules!"
fi

echo "========================================================="
