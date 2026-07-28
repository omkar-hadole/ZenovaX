const Redis = require("ioredis");
const logger = require("./logger");
const cache = require("./cache");
const config = require("../config");
const badgeService = require("../services/badgeService");
const mentorWalletService = require("../services/mentorWalletService");
const { cleanupOldNotifications, cleanupExpiredRefreshTokens } = require("./storageCleanup");

let myQueue;
let redisAvailable = false;

if (config.redisUrl && config.redisUrl.trim()) {
    try {
        const connection = new Redis(config.redisUrl, {
            maxRetriesPerRequest: null,
            connectTimeout: 5000,
            lazyConnect: true,
            retryStrategy(_times) {
                return null;
            }
        });

        connection.on("error", () => {});

        connection.connect().then(async () => {
            redisAvailable = true;
            try {
                const { Queue } = require("bullmq");
                myQueue = new Queue("ZenovaXQueue", { connection });
            } catch (bullmqErr) {
                logger.warn(`BullMQ not available: ${bullmqErr.message}`);
            }
        }).catch(() => {
            redisAvailable = false;
            connection.disconnect();
        });
    } catch {
        redisAvailable = false;
    }
}

let simulatedCounter = 0;

async function addJob(prisma, type, payload) {
    if (!redisAvailable || !myQueue) {
        simulatedCounter++;
        setTimeout(async () => {
            try {
                await processJob(prisma, { type, payload: JSON.stringify(payload) });
            } catch (err) {
                logger.error(`Fallback job processing failed: ${err.message}`);
            }
        }, 0);
        return { id: `fb-${simulatedCounter}` };
    }

    try {
        const job = await myQueue.add(type, payload, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 }
        });
        return job;
    } catch {
        simulatedCounter++;
        setTimeout(async () => {
            try {
                await processJob(prisma, { type, payload: JSON.stringify(payload) });
            } catch (err) {
                logger.error(`Fallback job processing failed: ${err.message}`);
            }
        }, 0);
        return { id: `fb-${simulatedCounter}` };
    }
}

async function processCalculateBadges(prisma, payload) {
    const { userId } = payload;
    if (!userId) return;
    await badgeService.calculateAndAwardBadges(prisma, cache, userId);
}

async function processJob(prisma, job) {
    const payload = JSON.parse(job.payload);
    switch (job.type) {
        case 'CALCULATE_BADGES':
            await processCalculateBadges(prisma, payload);
            break;
    }
}

let isWorkerRunning = false;

function startQueueWorker(prisma) {
    if (isWorkerRunning) return;
    isWorkerRunning = true;

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

            for (const session of endedSessions) {
                await prisma.session.update({
                    where: { id: session.id },
                    data: { status: 'COMPLETED' }
                });
                await addJob(prisma, 'CALCULATE_BADGES', { userId: session.mentorId });
                try {
                    const releasedCount = await mentorWalletService.releaseEarningsForSession(prisma, session.id);
                    if (releasedCount > 0) {
                        logger.info(`Released earnings for ${releasedCount} booking(s) on session ${session.id}.`);
                    }
                } catch (err) {
                    logger.error(`Failed to release mentor earnings for session ${session.id}: ${err.message}`);
                }
            }
        } catch (err) {
            logger.error(`Session completion loop error: ${err.message}`);
        }

        try {
            const sessionService = require("../services/sessionService");
            const cutoff = new Date(Date.now() - config.bookingHoldMinutes * 60 * 1000);
            const stale = await prisma.booking.findMany({
                where: { status: 'PENDING', bookedAt: { lt: cutoff } },
                select: { id: true }
            });
            for (const b of stale) {
                await sessionService.cancelPendingBooking(prisma, cache, b.id);
            }
        } catch (err) {
            logger.error(`Pending-booking sweep error: ${err.message}`);
        }

        await cleanupOldNotifications(prisma);
        await cleanupExpiredRefreshTokens(prisma);
    }, 60000);
}

module.exports = {
    addJob,
    startQueueWorker
};
