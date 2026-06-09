const logger = require("../utils/logger");
const { calculateBadges } = require("../utils/badges");
const { getFinishedSessionsCount, getUniqueLearnersCount } = require("../utils/sessionUtils");

exports.calculateAndAwardBadges = async (prisma, cache, userId) => {
    if (!userId) throw new Error('Missing userId for badge calculation');

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            totalSessions: true,
            averageRating: true,
            totalReviews: true,
            role: true,
            uniqueLearners: true,
            _count: {
                select: {
                    followers: true,
                    likesReceived: true,
                    receivedReviews: true
                }
            }
        }
    });

    if (!user) {
        logger.warn(`User ${userId} not found for badge calculation.`);
        return;
    }

    if (user.role !== 'MENTOR') {
        logger.debug(`User ${userId} is not a mentor. Skipping badge calculation.`);
        return;
    }

    const finishedSessionsCount = await getFinishedSessionsCount(prisma, userId);
    const uniqueLearners = await getUniqueLearnersCount(prisma, userId);

    // Self-healing DB update
    if (user.uniqueLearners !== uniqueLearners) {
        await prisma.user.update({
            where: { id: userId },
            data: { uniqueLearners }
        });
    }

    const effectiveSessions = Math.max(user.totalSessions, finishedSessionsCount);

    const earnedBadges = calculateBadges({
        ...user,
        totalSessions: effectiveSessions
    }, uniqueLearners);

    if (earnedBadges.length > 0) {
        const existingNotifications = await prisma.notification.findMany({
            where: {
                userId: userId,
                type: 'ACHIEVEMENT_UNLOCKED',
                title: { in: earnedBadges }
            },
            select: { title: true }
        });

        const existingBadgeTitles = new Set(existingNotifications.map(n => n.title));
        const newBadges = earnedBadges.filter(badge => !existingBadgeTitles.has(badge));

        if (newBadges.length > 0) {
            await prisma.notification.createMany({
                data: newBadges.map(badge => ({
                    userId: userId,
                    type: 'ACHIEVEMENT_UNLOCKED',
                    title: badge,
                    message: `Congratulations! You have unlocked the "${badge}" badge.`
                }))
            });
            logger.info(`User ${userId} unlocked new badges: ${newBadges.join(', ')}`);
        }
    }

    // Invalidate caches
    if (cache) {
        await cache.del(`profile_stats_${userId}`);
        logger.debug(`Invalidated cache for profile_stats_${userId}`);
    }
};
