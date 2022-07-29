const fs = require('fs');

export default ({ config }) => {
    if (process.env.BUILD_APK === 'true') {
        const key = fs.readFileSync('.google-api-key', 'utf8').trim();

        config.android.config = {
            googleMaps: { apiKey: key }
        }
    }
    return config;
};
