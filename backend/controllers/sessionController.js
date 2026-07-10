const sessionService = require("../services/sessionService");

exports.createSessionRequest = async (req, res, next) => {
    try {
        const sessionRequest = await sessionService.createSessionRequest(req.prisma, req.cache, req.user.id, req.body);
        return res.status(201).json({
            success: true,
            message: "Session request submitted successfully",
            request: sessionRequest
        });
    } catch (error) {
        return next(error);
    }
};

exports.getSessionRequestById = async (req, res, next) => {
    try {
        const request = await sessionService.getSessionRequestById(req.prisma, req.user.id, req.user.role, req.params.id);
        return res.json({ request });
    } catch (error) {
        return next(error);
    }
};

exports.updateSessionRequest = async (req, res, next) => {
    try {
        const updatedRequest = await sessionService.updateSessionRequest(req.prisma, req.cache, req.user.id, req.user.role, req.params.id, req.body);
        return res.json({
            success: true,
            message: "Session request updated successfully",
            request: updatedRequest
        });
    } catch (error) {
        return next(error);
    }
};

exports.getMyRequests = async (req, res, next) => {
    try {
        const requests = await sessionService.getMyRequests(req.prisma, req.user.id);
        return res.json({ requests });
    } catch (error) {
        return next(error);
    }
};

exports.getMySessions = async (req, res, next) => {
    try {
        const sessions = await sessionService.getMySessions(req.prisma, req.user.id);
        return res.json({ sessions });
    } catch (error) {
        return next(error);
    }
};

exports.bookSession = async (req, res, next) => {
    try {
        const result = await sessionService.bookSession(req.prisma, req.cache, req.user.id, req.params.id);
        return res.status(201).json({
            success: true,
            message: "Registration confirmed",
            booking: result.booking
        });
    } catch (error) {
        return next(error);
    }
};

exports.getBookingStatus = async (req, res, next) => {
    try {
        const result = await sessionService.getBookingStatus(req.prisma, req.cache, req.user.id, req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        return next(error);
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const sessions = await sessionService.getMyBookings(req.prisma, req.user.id);
        return res.json({ sessions });
    } catch (error) {
        return next(error);
    }
};

exports.getAllSessions = async (req, res, next) => {
    try {
        const { sessions, pagination } = await sessionService.getAllSessions(req.prisma, req.cache, req.user.id, req.query);
        return res.json({ sessions, pagination });
    } catch (error) {
        return next(error);
    }
};

exports.getSessionById = async (req, res, next) => {
    try {
        const session = await sessionService.getSessionById(req.prisma, req.user.id, req.params.id);
        return res.json({ session });
    } catch (error) {
        return next(error);
    }
};

exports.getMentorStats = async (req, res, next) => {
    try {
        const stats = await sessionService.getMentorStats(req.prisma, req.cache, req.user.id);
        return res.json({ stats });
    } catch (error) {
        return next(error);
    }
};

exports.verifyAttendance = async (req, res, next) => {
    try {
        const result = await sessionService.verifyAttendance(req.prisma, req.cache, req.user.id, req.body);
        return res.json({
            success: true,
            message: "Attendance Verified",
            user: result.user,
            session: result.session
        });
    } catch (error) {
        return next(error);
    }
};

exports.getRecentActivity = async (req, res, next) => {
    try {
        const activities = await sessionService.getRecentActivity(req.prisma, req.user.id);
        return res.json({ activities });
    } catch (error) {
        return next(error);
    }
};

exports.getLiveAccess = async (req, res, next) => {
    try {
        const result = await sessionService.getLiveAccess(req.prisma, req.user.id, req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        if (error.statusCode === 403 && error.reason) {
            return res.status(403).json({
                error: error.message,
                reason: error.reason,
                scheduledAt: error.scheduledAt
            });
        }
        return next(error);
    }
};
