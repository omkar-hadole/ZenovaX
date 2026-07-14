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
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID || '',
        keySecret: process.env.RAZORPAY_KEY_SECRET || '',
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    },
    // Platform commission taken from each paid booking (percent of session price).
    // The remainder is credited to the mentor's wallet.
    platformFeePercent: (() => {
        const pct = parseFloat(process.env.PLATFORM_FEE_PERCENT || '15');
        if (isNaN(pct) || pct < 0 || pct > 100) return 15;
        return pct;
    })(),
    // Minutes a PENDING (awaiting-payment) booking holds its seat before it is
    // auto-cancelled and the seat released.
    bookingHoldMinutes: parseInt(process.env.BOOKING_HOLD_MINUTES || '15', 10),
};
