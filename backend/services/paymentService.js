const axios = require("axios");
const crypto = require("crypto");
const config = require("../config");
const logger = require("../utils/logger");

const RAZORPAY_API = "https://api.razorpay.com/v1";

// Whether a live Razorpay integration is configured. When false, the app falls
// back to a simulated payment flow so paid bookings still work in development.
function isEnabled() {
    return Boolean(config.razorpay.keyId && config.razorpay.keySecret);
}

// Compute the platform-fee / mentor-share split for a given session price.
// Returns amounts rounded to 2 decimals. platformFee + mentorShare === price.
function computeFeeSplit(price) {
    const amount = Number(price) || 0;
    const platformFee = Math.round(amount * (config.platformFeePercent / 100) * 100) / 100;
    const mentorShare = Math.round((amount - platformFee) * 100) / 100;
    return { platformFee, mentorShare };
}

// Create a Razorpay order. `amount` is in rupees; Razorpay expects paise.
async function createOrder({ amount, receipt, notes }) {
    if (!isEnabled()) {
        throw new Error("Razorpay is not configured");
    }

    const response = await axios.post(
        `${RAZORPAY_API}/orders`,
        {
            amount: Math.round(amount * 100), // paise
            currency: "INR",
            receipt,
            notes: notes || {},
        },
        {
            auth: { username: config.razorpay.keyId, password: config.razorpay.keySecret },
            timeout: 15000,
        }
    );

    return response.data; // { id, amount, currency, receipt, status, ... }
}

// Verify the signature returned by Razorpay Checkout on the client.
// signature === HMAC_SHA256(orderId + "|" + paymentId, keySecret)
function verifyPaymentSignature({ orderId, paymentId, signature }) {
    if (!orderId || !paymentId || !signature) return false;
    const expected = crypto
        .createHmac("sha256", config.razorpay.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
    return timingSafeEqual(expected, signature);
}

// Verify a Razorpay webhook payload signature.
// signature === HMAC_SHA256(rawBody, webhookSecret)
function verifyWebhookSignature(rawBody, signature) {
    if (!config.razorpay.webhookSecret || !signature) return false;
    const expected = crypto
        .createHmac("sha256", config.razorpay.webhookSecret)
        .update(rawBody)
        .digest("hex");
    return timingSafeEqual(expected, signature);
}

// Fetch a payment from Razorpay — used by the webhook path to re-verify amount/status
// server-side rather than trusting the webhook body alone.
async function fetchPayment(paymentId) {
    if (!isEnabled()) throw new Error("Razorpay is not configured");
    const response = await axios.get(`${RAZORPAY_API}/payments/${paymentId}`, {
        auth: { username: config.razorpay.keyId, password: config.razorpay.keySecret },
        timeout: 15000,
    });
    return response.data;
}

// Refund a captured payment (full or partial). amount in rupees; omit for full refund.
async function refundPayment(paymentId, amount) {
    if (!isEnabled()) throw new Error("Razorpay is not configured");
    const body = amount ? { amount: Math.round(amount * 100) } : {};
    const response = await axios.post(`${RAZORPAY_API}/payments/${paymentId}/refund`, body, {
        auth: { username: config.razorpay.keyId, password: config.razorpay.keySecret },
        timeout: 15000,
    });
    return response.data;
}

// Constant-time string comparison that won't throw on length mismatch.
function timingSafeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    try {
        return crypto.timingSafeEqual(bufA, bufB);
    } catch (err) {
        logger.error(`timingSafeEqual failed: ${err.message}`);
        return false;
    }
}

module.exports = {
    isEnabled,
    computeFeeSplit,
    createOrder,
    verifyPaymentSignature,
    verifyWebhookSignature,
    fetchPayment,
    refundPayment,
    keyId: () => config.razorpay.keyId,
};
