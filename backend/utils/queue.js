const logger = require("./logger");
const cache = require("./cache");
const { calculateBadges } = require("./badges");
const { getFinishedSessionsCount, getUniqueLearnersCount } = require("./sessionUtils");

async function addJob(prisma, type, payload) {
    try {
        const job = await prisma.job.create({
            data: {
                type,
                payload: JSON.stringify(payload),
                status: 'PENDING'
            }
        });
        logger.info(`Job added to queue: ${type} (ID: ${job.id})`);
        return job;
    } catch (error) {
        logger.error(`Failed to add job to queue: ${error.message}`, error);
        throw error;
    }
}

async function processCalculateBadges(prisma, payload) {
    const { userId } = payload;
    if (!userId) throw new Error('Missing userId in payload');

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
    cache.del(`profile_stats_${userId}`);
    logger.debug(`Invalidated cache for profile_stats_${userId}`);
}

async function processJob(prisma, job) {
    const payload = JSON.parse(job.payload);
    switch (job.type) {
        case 'CALCULATE_BADGES':
            await processCalculateBadges(prisma, payload);
            break;
        default:
            throw new Error(`Unknown job type: ${job.type}`);
    }
}

let isWorkerRunning = false;

async function startQueueWorker(prisma) {
    if (isWorkerRunning) return;
    isWorkerRunning = true;

    logger.info('Queue worker started.');

    // 1. Process jobs queue loop
    setInterval(async () => {
        try {
            // Find one pending job and lock it
            const job = await prisma.$transaction(async (tx) => {
                const pendingJob = await tx.job.findFirst({
                    where: { status: 'PENDING' },
                    orderBy: { createdAt: 'asc' }
                });
                if (!pendingJob) return null;

                return await tx.job.update({
                    where: { id: pendingJob.id },
                    data: {
                        status: 'PROCESSING',
                        attempts: { increment: 1 }
                    }
                });
            });

            if (!job) return;

            try {
                await processJob(prisma, job);
                await prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'COMPLETED' }
                });
            } catch (jobErr) {
                logger.error(`Job processing error (ID: ${job.id}): ${jobErr.message}`, jobErr);
                const shouldRetry = job.attempts < job.maxAttempts;
                await prisma.job.update({
                    where: { id: job.id },
                    data: {
                        status: shouldRetry ? 'PENDING' : 'FAILED',
                        error: jobErr.stack || jobErr.message
                    }
                });
            }
        } catch (err) {
            logger.error(`Queue worker loop error: ${err.message}`, err);
        }
    }, 3000); // Check every 3 seconds

    // 2. Periodic check to mark sessions completed and queue badge jobs
    setInterval(async () => {
        try {
            const now = new Date();
            const activeSessions = await prisma.session.findMany({
                where: {
                    status: { in: ['UPCOMING', 'LIVE'] },
                    scheduledAt: { lt: now }
                }
            });

            const endedSessions = activeSessions.filter(session => {
                const endTime = new Date(session.scheduledAt).getTime() + session.duration * 60 * 1000;
                return endTime < now.getTime();
            });

            if (endedSessions.length > 0) {
                logger.info(`Found ${endedSessions.length} ended sessions. Transitioning to COMPLETED.`);
                for (const session of endedSessions) {
                    await prisma.session.update({
                        where: { id: session.id },
                        data: { status: 'COMPLETED' }
                    });
                    logger.info(`Session ${session.id} marked as COMPLETED.`);
                    // Queue badge calculation for the mentor
                    await addJob(prisma, 'CALCULATE_BADGES', { userId: session.mentorId });
                }
            }
        } catch (err) {
            logger.error(`Session completion worker loop error: ${err.message}`, err);
        }
    }, 60000); // Check every 60 seconds (1 minute)
}

module.exports = {
    addJob,
    startQueueWorker
};
