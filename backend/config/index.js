const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (!process.env.JWT_SECRET) {
    throw new Error("FATAL ERROR: JWT_SECRET is not defined. Cannot start server.");
}

module.exports = {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development',
    redisUrl: process.env.REDIS_URL || '',
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    jaas: {
        appId: process.env.JAAS_APP_ID,
        apiKeyId: process.env.JAAS_API_KEY_ID,
        privateKey: process.env.JAAS_PRIVATE_KEY ? process.env.JAAS_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    },
};
