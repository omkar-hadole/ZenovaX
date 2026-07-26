const { NotFoundError, ForbiddenError, BadRequestError } = require("../utils/errors");

exports.listNotifications = async (prisma, userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
    const skip = (page - 1) * limit;
    const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };

    const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    return {
        notifications,
        unreadCount,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

exports.getUnreadCount = async (prisma, userId) => {
    const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
    return { unreadCount };
};

exports.markAsRead = async (prisma, userId, notificationId) => {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) {
        throw new NotFoundError("Notification not found");
    }
    if (notification.userId !== userId) {
        throw new ForbiddenError("Not your notification");
    }
    if (notification.isRead) {
        return notification;
    }

    return prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() }
    });
};

exports.markAllAsRead = async (prisma, userId) => {
    const result = await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() }
    });
    return { updated: result.count };
};

const AUDIENCE_RESOLVERS = {
    ALL: (prisma) => prisma.user.findMany({ where: { isDeleted: false }, select: { id: true } }),
    LEARNERS: (prisma) => prisma.user.findMany({ where: { role: 'LEARNER', isDeleted: false }, select: { id: true } }),
    MENTORS: (prisma) => prisma.user.findMany({ where: { role: { in: ['MENTOR', 'BOTH'] }, isDeleted: false }, select: { id: true } }),
    COURSE_ENROLLED: (prisma, sessionId) =>
        prisma.booking.findMany({
            where: { sessionId, status: 'CONFIRMED' },
            select: { userId: true }
        }).then(bookings => bookings.map(b => ({ id: b.userId }))),
    SINGLE_USER: (prisma, userId) =>
        prisma.user.findMany({ where: { id: userId, isDeleted: false }, select: { id: true } }),
};

exports.pushAdminNotification = async (prisma, adminId, { title, message, link, audienceType, audienceId }) => {
    if (!title || !message) {
        throw new BadRequestError("Title and message are required");
    }
    if (!audienceType) {
        throw new BadRequestError("Audience type is required");
    }
    if (audienceType === 'COURSE_ENROLLED' && !audienceId) {
        throw new BadRequestError("Session ID is required for course-enrolled audience");
    }
    if (audienceType === 'SINGLE_USER' && !audienceId) {
        throw new BadRequestError("User ID is required for single user audience");
    }

    const resolver = AUDIENCE_RESOLVERS[audienceType];
    if (!resolver) {
        throw new BadRequestError("Invalid audience type");
    }

    const users = await resolver(prisma, audienceId);

    if (users.length === 0) {
        throw new BadRequestError("No users found for the selected audience");
    }

    const notificationData = users.map(user => ({
        userId: user.id,
        type: 'ADMIN_BROADCAST',
        title,
        message,
        link: link || null,
    }));

    await prisma.$transaction(async (tx) => {
        await tx.notification.createMany({ data: notificationData });

        await tx.adminNotificationLog.create({
            data: {
                adminId,
                title,
                message,
                link: link || null,
                audienceType,
                audienceId: audienceId || null,
                totalSent: users.length,
            }
        });
    });

    const recipients = users.map(u => u.id);
    return { success: true, totalSent: users.length, recipients };
};

exports.getNotificationHistory = async (prisma, queryParams = {}) => {
    const page = Math.max(1, parseInt(queryParams.page, 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(queryParams.limit, 10) || 20, 100));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        prisma.adminNotificationLog.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                admin: { select: { id: true, name: true } }
            }
        }),
        prisma.adminNotificationLog.count()
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

exports.registerDeviceToken = async (prisma, userId, token) => {
    if (!token) {
        throw new BadRequestError("Device token is required");
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { deviceTokens: true } });
    let tokens = [];
    try {
        tokens = user?.deviceTokens ? JSON.parse(user.deviceTokens) : [];
    } catch {
        tokens = [];
    }

    if (!tokens.includes(token)) {
        tokens.push(token);
        await prisma.user.update({
            where: { id: userId },
            data: { deviceTokens: JSON.stringify(tokens) }
        });
    }

    return { success: true };
};
