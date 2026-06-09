const adminService = require("../services/adminService");

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
        const session = await adminService.approveSession(req.prisma, req.body);
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
