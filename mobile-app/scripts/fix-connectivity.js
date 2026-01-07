const os = require('os');
const fs = require('fs');
const path = require('path');

/**
 * Robust Backend IP Detector
 * Automatically finds the local IP and writes it to .env.local
 */
function updateBackendIP() {
    const interfaces = os.networkInterfaces();
    let localIP = '127.0.0.1';

    // Find the primary IPv4 address (usually en0 or eth0)
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                // Prioritize the main Wi-Fi interface if possible
                if (name.includes('en') || name.includes('eth')) {
                    localIP = iface.address;
                    break;
                }
                localIP = iface.address;
            }
        }
    }

    const envContent = `EXPO_PUBLIC_API_BASE_URL=http://${localIP}:5000\n`;
    const envPath = path.join(__dirname, '../.env.local');

    try {
        fs.writeFileSync(envPath, envContent);
        console.log(`\x1b[32m✅ Connectivity Fix Applied: Using Backend at http://${localIP}:5000\x1b[0m`);
        console.log(`\x1b[34mℹ️ The IP was written to mobile-app/.env.local and will be used by Expo.\x1b[0m`);
    } catch (err) {
        console.error('❌ Failed to write .env.local', err);
    }
}

updateBackendIP();
