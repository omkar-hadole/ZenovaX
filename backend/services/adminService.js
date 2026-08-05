const { BadRequestError, NotFoundError } = require("../utils/errors");

exports.getDashboardStats = async (prisma) => {
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

    return {
        totalSessions,
        totalLearners,
        totalMentors,
        pendingApprovals,
        recentSessions
    };
};

exports.getPendingSessions = async (prisma) => {
    return await prisma.sessionRequest.findMany({
        where: { status: 'PENDING' },
        include: {
            mentor: {
                select: { name: true, email: true }
            }
        },
        orderBy: { requestedAt: 'desc' }
    });
};

exports.approveSession = async (prisma, cache, { requestId }) => {
    if (!requestId) {
        throw new BadRequestError("Request ID is required");
    }

    const sessionRequest = await prisma.sessionRequest.findUnique({
        where: { id: requestId }
    });

    if (!sessionRequest) {
        throw new NotFoundError("Session request not found");
    }

    if (sessionRequest.status !== 'PENDING') {
        throw new BadRequestError("Request is not pending");
    }

    const session = await prisma.$transaction(async (tx) => {
        await tx.sessionRequest.update({
            where: { id: requestId },
            data: { status: 'APPROVED', reviewedAt: new Date() }
        });

        const newSession = await tx.session.create({
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
                link: `/mentor/session/${newSession.id}`
            }
        });

        return newSession;
    }, {
        timeout: 10000
    });

    if (cache) {
        await cache.del('dashboard_upcoming_sessions');
        await cache.del('dashboard_top_mentors');
        await cache.delPattern('all_sessions_*');
    }

    return session;
};

exports.rejectSession = async (prisma, { requestId }) => {
    if (!requestId) {
        throw new BadRequestError("Request ID is required");
    }

    const sessionRequest = await prisma.sessionRequest.findUnique({
        where: { id: requestId },
        select: { id: true, mentorId: true, title: true, status: true }
    });

    if (!sessionRequest) {
        throw new NotFoundError("Session request not found");
    }

    if (sessionRequest.status !== 'PENDING') {
        throw new BadRequestError("Only pending requests can be rejected");
    }

    await prisma.$transaction([
        prisma.sessionRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED', reviewedAt: new Date() }
        }),
        prisma.notification.create({
            data: {
                userId: sessionRequest.mentorId,
                type: 'SESSION_REQUEST_REJECTED',
                title: 'Session Rejected',
                message: `Your session request "${sessionRequest.title}" has been rejected.`,
                link: '/mentor/sessions'
            }
        })
    ], { timeout: 15000 });

    return { success: true };
};

exports.getAllSessions = async (prisma, queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
        prisma.session.findMany({
            skip,
            take: limit,
            include: {
                mentor: {
                    select: { name: true }
                }
            },
            orderBy: { scheduledAt: 'desc' }
        }),
        prisma.session.count()
    ]);

    return {
        sessions,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

exports.deleteSession = async (prisma, cache, id) => {
    const session = await prisma.session.findUnique({
        where: { id },
        select: { mentorId: true }
    });

    if (!session) {
        throw new NotFoundError("Session not found");
    }

    await prisma.session.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() }
    });

    if (cache) {
        await cache.del(`profile_stats_${session.mentorId}`);
        await cache.del('dashboard_upcoming_sessions');
        await cache.del('dashboard_top_mentors');
        await cache.delPattern('all_sessions_*');
    }

    return { success: true };
};

exports.getAllUsers = async (prisma, queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            skip,
            take: limit,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count()
    ]);

    return {
        users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

exports.deleteUser = async (prisma, id) => {
    const user = await prisma.user.findUnique({
        where: { id }
    });

    if (!user) {
        throw new NotFoundError("User not found");
    }

    await prisma.user.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() }
    });

    return { success: true };
};

exports.getReports = async (prisma, queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
        prisma.report.findMany({
            skip,
            take: limit,
            include: {
                reporter: {
                    select: { name: true, email: true }
                },
                session: {
                    select: { title: true, requestId: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.report.count()
    ]);

    return {
        reports,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

exports.getSessionsList = async (prisma, queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const search = queryParams.search || '';

    const where = {
        isDeleted: false,
        ...(search ? { title: { contains: search } } : {})
    };

    const [sessions, total] = await Promise.all([
        prisma.session.findMany({
            where,
            skip,
            take: limit,
            select: {
                id: true,
                title: true,
                subject: true,
                mentor: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.session.count({ where })
    ]);

    return { sessions, total };
};

exports.searchUsers = async (prisma, queryParams) => {
    const search = queryParams.search || '';
    const role = queryParams.role || '';
    const limit = parseInt(queryParams.limit, 10) || 20;

    if (!search) {
        return { users: [] };
    }

    const where = {
        isDeleted: false,
        OR: [
            { name: { contains: search } },
            { email: { contains: search } },
        ],
        ...(role ? { role } : {})
    };

    const users = await prisma.user.findMany({
        where,
        take: limit,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profilePicture: true,
        },
        orderBy: { name: 'asc' }
    });

    return { users };
};

exports.handleReportAction = async (prisma, cache, { reportId, action }) => {
    if (!reportId || !action) {
        throw new BadRequestError("Report ID and action are required");
    }

    const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: { session: true }
    });

    if (!report) {
        throw new NotFoundError("Report not found");
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

            if (cache && report.session) {
                await cache.del(`profile_stats_${report.session.mentorId}`);
                await cache.delPattern('all_sessions_*');
            }

            return { message: "Session deleted and report marked as resolved" };
        } else {
            await prisma.report.update({
                where: { id: reportId },
                data: { status: 'RESOLVED', resolvedAt: new Date() }
            });
            return { message: "Session already deleted, report marked as resolved" };
        }
    } else if (action === 'IGNORE') {
        await prisma.report.update({
            where: { id: reportId },
            data: { status: 'IGNORED', resolvedAt: new Date() }
        });
        return { message: "Report ignored" };
    } else if (action === 'RESOLVE') {
        await prisma.report.update({
            where: { id: reportId },
            data: { status: 'RESOLVED', resolvedAt: new Date() }
        });
        return { message: "Report resolved" };
    } else {
        throw new BadRequestError("Invalid action");
    }
};
