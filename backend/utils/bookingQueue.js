const Redis = require("ioredis");
const logger = require("./logger");
const config = require("../config");
const prisma = require("./db");
const cache = require("./cache");

// Lazy-load bullmq — avoids Vercel NFT trace issues with semver
let Queue, Worker;
try {
    ({ Queue, Worker } = require("bullmq"));
} catch (err) {
    logger.warn(`BullMQ not available for booking queue: ${err.message}`);
}

// Global reference connection to avoid creating too many clients
let connection = null;
if (config.redisUrl && config.redisUrl.trim()) {
    try {
        connection = new Redis(config.redisUrl, {
            maxRetriesPerRequest: null
        });
    } catch (err) {
        logger.error(`Failed to create Redis connection for booking queue: ${err.message}`);
    }
}

// SINGLE queue for ALL bookings
let bookingsQueue = null;
if (Queue && connection) {
    bookingsQueue = new Queue('bookings', {
        connection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 500,
        },
    });
}

// SINGLE worker processing all bookings
let bookingsWorker = null;
if (Worker && connection) {
    bookingsWorker = new Worker(
        'bookings',
        async (job) => {
            const { userId, sessionId } = job.data;
            await processBooking(userId, sessionId);
        },
        {
            connection,
            concurrency: 10, // process 10 bookings at once across all sessions
        }
    );

    bookingsWorker.on("completed", (job) => {
        logger.info(`Booking job completed: ID = ${job.id}`);
    });

    bookingsWorker.on("failed", (job, err) => {
        logger.error(`Booking job failed: ID = ${job.id}. Error: ${err.message}`);
    });
}

async function processBooking(userId, sessionId) {
    const sessionService = require("../services/sessionService");
    const crypto = require("crypto");

    // Acquire Redis distributed lock
    const lockKey = `lock:session:${sessionId}`;
    const lockValue = crypto.randomBytes(16).toString('hex');

    if (!connection) {
        throw new Error('Redis connection is not available');
    }

    const acquired = await connection.set(lockKey, lockValue, 'NX', 'PX', 10000);
    if (!acquired) {
        throw new Error('Session booking is being processed, please retry');
    }

    try {
        // Execute booking transaction
        const result = await sessionService.executeBookingTransaction(prisma, cache, userId, sessionId);

        // Cache success result for polling
        if (cache) {
            await cache.set(`booking_result:${userId}:${sessionId}`, {
                status: 'CONFIRMED',
                booking: result.booking
            }, 300); // cache for 5 minutes
        }
        logger.info(`Booking successful via BullMQ: User = ${userId}, Session = ${sessionId}`);
    } catch (err) {
        logger.error(`Booking job failed via BullMQ: User = ${userId}, Session = ${sessionId}. Error: ${err.message}`);

        // Cache failure result for polling
        if (cache) {
            await cache.set(`booking_result:${userId}:${sessionId}`, {
                status: 'FAILED',
                error: err.message
            }, 300);
        }
        throw err; // bubble up so BullMQ registers failure
    } finally {
        // Safe lock release
        const currentLockVal = await connection.get(lockKey);
        if (currentLockVal === lockValue) {
            await connection.del(lockKey);
        }
    }
}

async function addBookingJob(prisma, cache, userId, sessionId) {
    if (!bookingsQueue) {
        logger.warn("BullMQ not available — executing booking synchronously");
        const sessionService = require("../services/sessionService");
        return await sessionService.executeBookingTransaction(prisma, cache, userId, sessionId);
    }

    const job = await bookingsQueue.add(
        'process-booking',
        { userId, sessionId },
        {
            jobId: `booking-${userId}-${sessionId}`, // prevents duplicate bookings
            attempts: 3,
        }
    );
    logger.info(`Booking job enqueued in shared queue: Job ID = ${job.id}, User ID = ${userId}, Session ID = ${sessionId}`);
    return job;
}

module.exports = {
    bookingsQueue,
    addBookingJob
};
