const Redis = require("ioredis");
const logger = require("./logger");
const cache = require("./cache");
const config = require("../config");
const badgeService = require("../services/badgeService");
const mentorWalletService = require("../services/mentorWalletService");

// Dedicated Redis connection for BullMQ with maxRetriesPerRequest: null
let connection;
let myQueue;

if (config.redisUrl && config.redisUrl.trim()) {
    try {
        connection = new Redis(config.redisUrl, {
            maxRetriesPerRequest: null
        });
        // Lazily require bullmq — may fail on Vercel if semver submodules are not bundled
        try {
            const { Queue } = require("bullmq");
            myQueue = new Queue("ZenovaXQueue", { connection });
            logger.info("BullMQ Queue initialized successfully.");
        } catch (bullmqErr) {
            logger.warn(`BullMQ not available (queue features disabled): ${bullmqErr.message}`);
        }
    } catch (err) {
        logger.error(`Failed to initialize Redis connection: ${err.message}`);
    }
}

async function addJob(prisma, type, payload) {
    try {
        if (!myQueue) {
            logger.warn(`BullMQ is not initialized (no REDIS_URL). Simulating job execution for type: ${type}`);
            // Fallback: If no Redis (e.g. offline testing), execute immediately/operationally
            // to prevent complete failure.
            setTimeout(async () => {
                try {
                    await processJob(prisma, { type, payload: JSON.stringify(payload) });
                } catch (err) {
                    logger.error(`Simulated job processing failed: ${err.message}`);
                }
            }, 0);
            return { id: "simulated" };
        }

        const job = await myQueue.add(type, payload, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        });
        logger.info(`Job added to BullMQ: ${type} (ID: ${job.id})`);
        return job;
    } catch (error) {
        logger.error(`Failed to add job to BullMQ: ${error.message}`, error);
        throw error;
    }
}

async function processCalculateBadges(prisma, payload) {
    const { userId } = payload;
    if (!userId) throw new Error('Missing userId in payload');
    await badgeService.calculateAndAwardBadges(prisma, cache, userId);
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

function startQueueWorker(prisma) {
    if (isWorkerRunning) return;
    isWorkerRunning = true;

    if (!connection) {
        logger.warn("Skipping BullMQ Worker initialization: REDIS_URL is not set.");
        return;
    }

    logger.info('BullMQ worker starting...');

    // Lazy require Worker to avoid loading bullmq when Redis is unavailable
    let Worker;
    try {
        ({ Worker } = require("bullmq"));
    } catch (err) {
        logger.warn(`BullMQ Worker not available: ${err.message}`);
        return;
    }
    const worker = new Worker("ZenovaXQueue", async (job) => {
        logger.info(`Processing job: ${job.name} (ID: ${job.id})`);
        await processJob(prisma, { type: job.name, payload: JSON.stringify(job.data) });
    }, {
        connection,
        concurrency: 5
    });

    worker.on("completed", (job) => {
        logger.info(`Job completed: ${job.name} (ID: ${job.id})`);
    });

    worker.on("failed", (job, err) => {
        logger.error(`Job failed: ${job.name} (ID: ${job.id}). Error: ${err.message}`, err);
    });

    logger.info('BullMQ worker started.');

    // Periodic check to mark ended sessions as COMPLETED and queue badge jobs
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
                    // Queue badge calculation for the mentor via BullMQ
                    await addJob(prisma, 'CALCULATE_BADGES', { userId: session.mentorId });
                    // Release held mentor earnings (pending -> available) for this session's paid bookings
                    try {
                        const releasedCount = await mentorWalletService.releaseEarningsForSession(prisma, session.id);
                        if (releasedCount > 0) {
                            logger.info(`Released earnings for ${releasedCount} booking(s) on session ${session.id}.`);
                        }
                    } catch (err) {
                        logger.error(`Failed to release mentor earnings for session ${session.id}: ${err.message}`, err);
                    }
                }
            }
        } catch (err) {
            logger.error(`Session completion worker loop error: ${err.message}`, err);
        }

        // Release seats held by PENDING (awaiting-payment) bookings that were never
        // completed within the hold window, so abandoned checkouts don't block seats.
        try {
            const sessionService = require("../services/sessionService");
            const cutoff = new Date(Date.now() - config.bookingHoldMinutes * 60 * 1000);
            const stale = await prisma.booking.findMany({
                where: { status: 'PENDING', bookedAt: { lt: cutoff } },
                select: { id: true }
            });
            for (const b of stale) {
                await sessionService.cancelPendingBooking(prisma, cache, b.id);
                logger.info(`Released seat for expired pending booking ${b.id}.`);
            }
        } catch (err) {
            logger.error(`Pending-booking sweep error: ${err.message}`, err);
        }
    }, 60000); // Check every 60 seconds
}

module.exports = {
    addJob,
    startQueueWorker
};
