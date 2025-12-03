const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}

module.exports = {
    port: process.env.PORT || 5000,
    jwtSecret: process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV || 'development',
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
};
