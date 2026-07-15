const adminService = require("../services/adminService");
const mentorWalletService = require("../services/mentorWalletService");

exports.getDashboardStats = async (req, res, next) => {
    try {
        const stats = await adminService.getDashboardStats(req.prisma);
        return res.json(stats);
    } catch (error) {
        return next(error);
    }
};

exports.getPendingSessions = async (req, res, next) => {
    try {
        const pendingSessions = await adminService.getPendingSessions(req.prisma);
        return res.json(pendingSessions);
    } catch (error) {
        return next(error);
    }
};

exports.approveSession = async (req, res, next) => {
    try {
        const session = await adminService.approveSession(req.prisma, req.cache, req.body);
        return res.json({ message: "Session approved successfully", session });
    } catch (error) {
        return next(error);
    }
};

exports.rejectSession = async (req, res, next) => {
    try {
        await adminService.rejectSession(req.prisma, req.body);
        return res.json({ message: "Session rejected successfully" });
    } catch (error) {
        return next(error);
    }
};

exports.getAllSessions = async (req, res, next) => {
    try {
        const { sessions, pagination } = await adminService.getAllSessions(req.prisma, req.query);
        return res.json({ sessions, pagination });
    } catch (error) {
        return next(error);
    }
};

exports.deleteSession = async (req, res, next) => {
    try {
        await adminService.deleteSession(req.prisma, req.cache, req.params.id);
        return res.json({ message: "Session deleted successfully" });
    } catch (error) {
        return next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const { users, pagination } = await adminService.getAllUsers(req.prisma, req.query);
        return res.json({ users, pagination });
    } catch (error) {
        return next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        await adminService.deleteUser(req.prisma, req.params.id);
        return res.json({ message: "User deleted successfully" });
    } catch (error) {
        return next(error);
    }
};

exports.getReports = async (req, res, next) => {
    try {
        const { reports, pagination } = await adminService.getReports(req.prisma, req.query);
        return res.json({ reports, pagination });
    } catch (error) {
        return next(error);
    }
};

exports.handleReportAction = async (req, res, next) => {
    try {
        const result = await adminService.handleReportAction(req.prisma, req.cache, req.body);
        return res.json(result);
    } catch (error) {
        return next(error);
    }
};

// ---- Payments & payouts admin ----

exports.getPaymentsOverview = async (req, res, next) => {
    try {
        const overview = await mentorWalletService.getPaymentsOverview(req.prisma);
        return res.json({ overview });
    } catch (error) {
        return next(error);
    }
};

exports.getMentorLeaderboard = async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
        const leaderboard = await mentorWalletService.getMentorEarningsLeaderboard(req.prisma, limit);
        return res.json({ leaderboard });
    } catch (error) {
        return next(error);
    }
};

exports.getPayoutAccounts = async (req, res, next) => {
    try {
        const accounts = await mentorWalletService.listPayoutAccounts(req.prisma, req.query.status);
        return res.json({ accounts });
    } catch (error) {
        return next(error);
    }
};

exports.verifyPayoutAccount = async (req, res, next) => {
    try {
        const account = await mentorWalletService.verifyPayoutAccount(req.prisma, req.params.id);
        return res.json({ success: true, message: "Payout account verified", account });
    } catch (error) {
        return next(error);
    }
};

exports.rejectPayoutAccount = async (req, res, next) => {
    try {
        const account = await mentorWalletService.rejectPayoutAccount(req.prisma, req.params.id, req.body.reason);
        return res.json({ success: true, message: "Payout account rejected", account });
    } catch (error) {
        return next(error);
    }
};

exports.getPayouts = async (req, res, next) => {
    try {
        const payouts = await mentorWalletService.listAllPayouts(req.prisma, req.query.status);
        return res.json({ payouts });
    } catch (error) {
        return next(error);
    }
};

exports.markPayoutPaid = async (req, res, next) => {
    try {
        const payout = await mentorWalletService.markPayoutPaid(req.prisma, req.params.id, req.body.gatewayPayoutId);
        return res.json({ success: true, message: "Payout marked as paid", payout });
    } catch (error) {
        return next(error);
    }
};

exports.markPayoutFailed = async (req, res, next) => {
    try {
        const payout = await mentorWalletService.markPayoutFailed(req.prisma, req.params.id, req.body.reason);
        return res.json({ success: true, message: "Payout marked as failed", payout });
    } catch (error) {
        return next(error);
    }
};
