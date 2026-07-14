const mentorWalletService = require("../services/mentorWalletService");

exports.getWalletSummary = async (req, res, next) => {
    try {
        const summary = await mentorWalletService.getWalletSummary(req.prisma, req.user.id);
        return res.json(summary);
    } catch (error) {
        return next(error);
    }
};

exports.getPayoutAccount = async (req, res, next) => {
    try {
        const account = await mentorWalletService.getPayoutAccount(req.prisma, req.user.id);
        return res.json({ account });
    } catch (error) {
        return next(error);
    }
};

exports.upsertPayoutAccount = async (req, res, next) => {
    try {
        const account = await mentorWalletService.upsertPayoutAccount(req.prisma, req.user.id, req.body);
        return res.json({
            success: true,
            message: "Payout account submitted for verification",
            account
        });
    } catch (error) {
        return next(error);
    }
};

exports.requestPayout = async (req, res, next) => {
    try {
        const result = await mentorWalletService.requestPayout(req.prisma, req.user.id, Number(req.body.amount));
        return res.status(201).json({
            success: true,
            message: "Payout requested",
            ...result
        });
    } catch (error) {
        return next(error);
    }
};

exports.getPayoutHistory = async (req, res, next) => {
    try {
        const payouts = await mentorWalletService.getPayoutHistory(req.prisma, req.user.id);
        return res.json({ payouts });
    } catch (error) {
        return next(error);
    }
};

// Admin-only: finalize a payout once it has actually been sent via a real gateway.
exports.markPayoutPaid = async (req, res, next) => {
    try {
        const payout = await mentorWalletService.markPayoutPaid(req.prisma, req.params.id, req.body.gatewayPayoutId);
        return res.json({ success: true, payout });
    } catch (error) {
        return next(error);
    }
};

// Admin-only: mark a payout as failed and refund the reserved amount to the mentor's balance.
exports.markPayoutFailed = async (req, res, next) => {
    try {
        const payout = await mentorWalletService.markPayoutFailed(req.prisma, req.params.id, req.body.reason);
        return res.json({ success: true, payout });
    } catch (error) {
        return next(error);
    }
};
