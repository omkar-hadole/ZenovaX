const paymentService = require("../services/paymentService");
const sessionService = require("../services/sessionService");
const logger = require("../utils/logger");

// Tells the frontend whether to run the real Razorpay checkout or the simulated flow.
exports.getConfig = async (req, res) => {
    return res.json({
        enabled: paymentService.isEnabled(),
        keyId: paymentService.isEnabled() ? paymentService.keyId() : null
    });
};

// Razorpay webhook — the reliable source of truth for payment status. Mounted with a
// raw body parser so the HMAC signature can be verified against the exact bytes sent.
exports.handleWebhook = async (req, res) => {
    try {
        const signature = req.headers["x-razorpay-signature"];
        const rawBody = req.body; // Buffer (express.raw)

        if (!paymentService.verifyWebhookSignature(rawBody, signature)) {
            logger.warn("Rejected Razorpay webhook: bad signature");
            return res.status(400).json({ error: "Invalid signature" });
        }

        const event = JSON.parse(rawBody.toString("utf8"));
        const type = event.event;

        if (type === "payment.captured" || type === "order.paid") {
            const paymentEntity = event.payload?.payment?.entity;
            const orderId = paymentEntity?.order_id;
            const paymentId = paymentEntity?.id;

            if (orderId) {
                const txn = await req.prisma.transaction.findUnique({ where: { gatewayOrderId: orderId } });
                if (txn) {
                    await sessionService.confirmBookingPaid(req.prisma, req.cache, {
                        bookingId: txn.bookingId,
                        gatewayPaymentId: paymentId
                    });
                    logger.info(`Webhook confirmed booking ${txn.bookingId} (order ${orderId})`);
                }
            }
        } else if (type === "payment.failed") {
            const orderId = event.payload?.payment?.entity?.order_id;
            if (orderId) {
                const txn = await req.prisma.transaction.findUnique({ where: { gatewayOrderId: orderId } });
                if (txn) {
                    await sessionService.cancelPendingBooking(req.prisma, req.cache, txn.bookingId);
                    logger.info(`Webhook cancelled pending booking ${txn.bookingId} (order ${orderId})`);
                }
            }
        }

        // Always 200 so Razorpay doesn't retry an event we've accepted.
        return res.json({ received: true });
    } catch (error) {
        logger.error(`Webhook processing error: ${error.message}`, error);
        // 200 on internal error too — the webhook was authentic; retries won't help and
        // reconciliation is handled by verify-payment / the pending-sweep job.
        return res.json({ received: true });
    }
};
