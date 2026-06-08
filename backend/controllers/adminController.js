const { PrismaClient } = require('@prisma/client');

exports.getDashboardStats = async (req, res) => {
    try {
        const prisma = req.prisma;

        const [
            totalSessions,
            totalLearners,
            totalMentors,
            pendingApprovals,
            recentSessions
        ] = await Promise.all([
            prisma.session.count(),
            prisma.user.count({ where: { role: 'LEARNER' } }),
            prisma.user.count({ where: { role: 'MENTOR' } }),
            prisma.sessionRequest.count({ where: { status: 'PENDING' } }),
            prisma.session.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { mentor: { select: { name: true } } }
            })
        ]);

        res.json({
            totalSessions,
            totalLearners,
            totalMentors,
            pendingApprovals,
            recentSessions
        });
    } catch (error) {
        console.error("Get Dashboard Stats Error:", error);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};

exports.getPendingSessions = async (req, res) => {
    try {
        const prisma = req.prisma;
        const pendingSessions = await prisma.sessionRequest.findMany({
            where: { status: 'PENDING' },
            include: {
                mentor: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { requestedAt: 'desc' }
        });
        res.json(pendingSessions);
    } catch (error) {
        console.error("Get Pending Sessions Error:", error);
        res.status(500).json({ error: "Failed to fetch pending sessions" });
    }
};

exports.approveSession = async (req, res) => {
    try {
        const prisma = req.prisma;
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({ error: "Request ID is required" });
        }

        const sessionRequest = await prisma.sessionRequest.findUnique({
            where: { id: requestId }
        });

        if (!sessionRequest) {
            return res.status(404).json({ error: "Session request not found" });
        }

        if (sessionRequest.status !== 'PENDING') {
            return res.status(400).json({ error: "Request is not pending" });
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.sessionRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED', reviewedAt: new Date() }
            });

            const session = await tx.session.create({
                data: {
                    title: sessionRequest.title,
                    description: sessionRequest.description,
                    subject: sessionRequest.subject,
                    department: sessionRequest.department,
                    topics: sessionRequest.topics,
                    mentorId: sessionRequest.mentorId,
                    mode: sessionRequest.mode,
                    priceType: sessionRequest.priceType,
                    price: sessionRequest.price,
                    maxSeats: sessionRequest.maxSeats,
                    availableSeats: sessionRequest.maxSeats,
                    venue: sessionRequest.venue,
                    meetingLink: sessionRequest.meetingLink,
                    scheduledAt: sessionRequest.proposedDate,
                    duration: sessionRequest.duration,
                    requestId: sessionRequest.id
                }
            });

            await tx.notification.create({
                data: {
                    userId: sessionRequest.mentorId,
                    type: 'SESSION_REQUEST_APPROVED',
                    title: 'Session Approved',
                    message: `Your session request "${sessionRequest.title}" has been approved.`,
                    link: `/sessions/${session.id}`
                }
            });

            return session;
        }, {
            timeout: 10000
        });

        res.json({ message: "Session approved successfully", session: result });
    } catch (error) {
        console.error("Approve Session Error:", error);
        res.status(500).json({ error: "Failed to approve session", details: error.message });
    }
};

exports.rejectSession = async (req, res) => {
    try {
        const prisma = req.prisma;
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({ error: "Request ID is required" });
        }

        await prisma.sessionRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', reviewedAt: new Date() }
        });

        const request = await prisma.sessionRequest.findUnique({ where: { id: requestId } });
        if (request) {
            await prisma.notification.create({
                data: {
                    userId: request.mentorId,
                    type: 'SESSION_REQUEST_REJECTED',
                    title: 'Session Rejected',
                    message: `Your session request "${request.title}" has been rejected.`,
                }
            });
        }

        res.json({ message: "Session rejected successfully" });
    } catch (error) {
        console.error("Reject Session Error:", error);
        res.status(500).json({ error: "Failed to reject session" });
    }
};

exports.getAllSessions = async (req, res) => {
    try {
        const prisma = req.prisma;
        const sessions = await prisma.session.findMany({
            include: {
                mentor: {
                    select: { name: true }
                }
            },
            orderBy: { scheduledAt: 'desc' }
        });
        res.json(sessions);
    } catch (error) {
        console.error("Get All Sessions Error:", error);
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
};

exports.deleteSession = async (req, res) => {
    try {
        const prisma = req.prisma;
        const { id } = req.params;

        await prisma.session.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() }
        });

        res.json({ message: "Session deleted successfully" });
    } catch (error) {
        console.error("Delete Session Error:", error);
        res.status(500).json({ error: "Failed to delete session" });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const prisma = req.prisma;
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const prisma = req.prisma;
        const { id } = req.params;

        await prisma.user.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() }
        });

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete User Error:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
};

exports.getReports = async (req, res) => {
    try {
        const prisma = req.prisma;
        const reports = await prisma.report.findMany({
            include: {
                reporter: {
                    select: { name: true, email: true }
                },
                session: {
                    select: { title: true, requestId: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    } catch (error) {
        console.error("Get Reports Error:", error);
        res.status(500).json({ error: "Failed to fetch reports" });
    }
};

exports.handleReportAction = async (req, res) => {
    try {
        const prisma = req.prisma;
        const { reportId, action } = req.body;

        if (!reportId || !action) {
            return res.status(400).json({ error: "Report ID and action are required" });
        }

        const report = await prisma.report.findUnique({
            where: { id: reportId },
            include: { session: true }
        });

        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        if (action === 'DELETE_SESSION') {
            if (report.sessionId) {
                await prisma.session.update({
                    where: { id: report.sessionId },
                    data: { isDeleted: true, deletedAt: new Date() }
                });
                await prisma.report.update({
                    where: { id: reportId },
                    data: { status: 'RESOLVED', resolvedAt: new Date() }
                });
                res.json({ message: "Session deleted and report marked as resolved" });
            } else {
                await prisma.report.update({
                    where: { id: reportId },
                    data: { status: 'RESOLVED', resolvedAt: new Date() }
                });
                res.json({ message: "Session already deleted, report marked as resolved" });
            }
        } else if (action === 'IGNORE') {
            await prisma.report.update({
                where: { id: reportId },
                data: { status: 'IGNORED', resolvedAt: new Date() }
            });
            res.json({ message: "Report ignored" });
        } else if (action === 'RESOLVE') {
            await prisma.report.update({
                where: { id: reportId },
                data: { status: 'RESOLVED', resolvedAt: new Date() }
            });
            res.json({ message: "Report resolved" });
        } else {
            res.status(400).json({ error: "Invalid action" });
        }
    } catch (error) {
        console.error("Handle Report Action Error:", error);
        res.status(500).json({ error: "Failed to handle report action" });
    }
};
