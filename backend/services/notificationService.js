const { NotFoundError, ForbiddenError } = require("../utils/errors");

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
