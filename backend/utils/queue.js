const crypto = require("crypto");
const Redis = require("ioredis");
const logger = require("./logger");
const cache = require("./cache");
const config = require("../config");
const badgeService = require("../services/badgeService");
const mentorWalletService = require("../services/mentorWalletService");
const { cleanupOldNotifications, cleanupExpiredRefreshTokens } = require("./storageCleanup");

let myQueue;
let redisConnection;
let redisAvailable = false;

const QUEUE_NAME = "ZenovaXQueue";

if (config.redisUrl && config.redisUrl.trim()) {
    try {
        redisConnection = new Redis(config.redisUrl, {
            maxRetriesPerRequest: null,
            connectTimeout: 5000,
            lazyConnect: true,
            retryStrategy(_times) {
                return null;
            }
        });

        redisConnection.on("error", () => {});

        redisConnection.connect().then(async () => {
            redisAvailable = true;
            try {
                const { Queue } = require("bullmq");
                myQueue = new Queue(QUEUE_NAME, { connection: redisConnection });
            } catch (bullmqErr) {
                logger.warn(`BullMQ not available: ${bullmqErr.message}`);
            }
        }).catch(() => {
            redisAvailable = false;
            redisConnection.disconnect();
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

// Drains pending badge jobs from the BullMQ queue. Used both by the long-lived
// worker loop (non-serverless) and by the scheduled background Lambda in
// serverless, where there is no persistent process listening on the queue.
async function drainBadgeQueue(prisma, maxJobs = 200) {
    if (!redisAvailable || !myQueue) return 0;

    const { Worker } = require("bullmq");
    const worker = new Worker(
        QUEUE_NAME,
        async () => {},
        { connection: redisConnection, concurrency: 4, autorun: false }
    );

    let processed = 0;
    try {
        await worker.waitUntilReady();
        // A single token claims jobs as "active"; we finish each before moving
        // on so processing is unambiguous and re-run-safe.
        const token = crypto.randomUUID();
        let job = await worker.getNextJob(token);
        while (job && processed < maxJobs) {
            await processJob(prisma, { type: job.name, payload: JSON.stringify(job.data) });
            await job.moveToCompleted(null, token);
            processed++;
            job = await worker.getNextJob(token);
        }
    } catch (err) {
        if (!/not connected|no queue/i.test(err.message || '')) {
            logger.error(`Badge queue drain error: ${err.message}`);
        }
    } finally {
        await worker.close().catch(() => {});
    }

    return processed;
}

// Guards a single maintenance pass so two overlapping passes (e.g. a scheduled
// Lambda firing twice, or a slow pass in the loop) never double-release
// earnings or double-cancel bookings.
let workerPassInFlight = false;

// Runs ONE full maintenance sweep: marks ended sessions complete, releases the
// mentor earnings for them, cancels stale pending bookings, and performs
// storage housekeeping. Safe to call from a scheduled Lambda or a long-lived
// background loop.
async function runWorkerPass(prisma) {
    if (workerPassInFlight) return;
    workerPassInFlight = true;

    try {
        const now = new Date();

        // Session completion + earnings release.
        const toComplete = await prisma.session.findMany({
            where: {
                status: { in: ['UPCOMING', 'LIVE'] },
                scheduledAt: { lt: now }
            },
            select: { id: true, mentorId: true, scheduledAt: true, duration: true, learningRequestId: true }
        });

        const endedSessions = toComplete.filter(session => {
            const endTime = new Date(session.scheduledAt).getTime() + session.duration * 60 * 1000;
            return endTime < now.getTime();
        });

        for (const session of endedSessions) {
            await prisma.session.updateMany({
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

        // Batch-complete any learner-demand requests whose sessions just ended.
        // Doing this once after the loop avoids one extra DB round-trip per session.
        const fulfilledRequestIds = endedSessions
            .filter(s => s.learningRequestId)
            .map(s => s.learningRequestId);
        if (fulfilledRequestIds.length > 0) {
            await prisma.learningRequest.updateMany({
                where: { id: { in: fulfilledRequestIds }, status: { in: ['OPEN', 'SESSION_CREATED'] } },
                data: { status: 'COMPLETED' }
            });
        }

        // Pending-booking sweep.
        const sessionService = require("../services/sessionService");
        const cutoff = new Date(Date.now() - config.bookingHoldMinutes * 60 * 1000);
        const stale = await prisma.booking.findMany({
            where: { status: 'PENDING', bookedAt: { lt: cutoff } },
            select: { id: true }
        });
        for (const b of stale) {
            await sessionService.cancelPendingBooking(prisma, cache, b.id);
        }

        await cleanupOldNotifications(prisma);
        await cleanupExpiredRefreshTokens(prisma);
    } catch (err) {
        logger.error(`Session completion loop error: ${err.message}`);
    } finally {
        workerPassInFlight = false;
    }
}

let isWorkerRunning = false;

// Background loop for long-lived (non-serverless) processes only. Uses a
// recursive setTimeout so iterations never overlap, and drains the badge queue
// after each maintenance pass.
function startQueueWorker(prisma) {
    if (isWorkerRunning) return;
    isWorkerRunning = true;

    const tick = async () => {
        try {
            await runWorkerPass(prisma);
        } catch (err) {
            logger.error(`Queue worker pass error: ${err.message}`);
        }
        try {
            await drainBadgeQueue(prisma);
        } catch (err) {
            logger.error(`Queue worker drain error: ${err.message}`);
        }
        setTimeout(tick, 60000);
    };

    // First pass soon after boot, then every minute.
    setTimeout(tick, 5000);
}

module.exports = {
    addJob,
    startQueueWorker,
    runWorkerPass,
    drainBadgeQueue
};