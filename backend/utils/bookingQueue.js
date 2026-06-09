const Redis = require("ioredis");
const logger = require("./logger");
const config = require("../config");

const activeWorkers = new Map();

// Lazy-load bullmq — avoids Vercel NFT trace issues with semver
let Queue, Worker;
try {
    ({ Queue, Worker } = require("bullmq"));
} catch (err) {
    logger.warn(`BullMQ not available for booking queue: ${err.message}`);
}

// Helper to get a Redis connection for BullMQ (maxRetriesPerRequest must be null)
function getRedisConnection() {
    return new Redis(config.redisUrl, {
        maxRetriesPerRequest: null
    });
}

// Global reference connection to avoid creating too many clients
let connection = null;
if (config.redisUrl && config.redisUrl.trim()) {
    try {
        connection = getRedisConnection();
    } catch (err) {
        logger.error(`Failed to create Redis connection for booking queue: ${err.message}`);
    }
}

async function addBookingJob(prisma, cache, userId, sessionId) {
    if (!Queue || !connection) {
        logger.warn("BullMQ not available — executing booking synchronously");
        const sessionService = require("../services/sessionService");
        return await sessionService.executeBookingTransaction(prisma, cache, userId, sessionId);
    }

    const queueName = `booking-${sessionId}`;
    const queue = new Queue(queueName, { connection });

    // Enqueue job with userId
    const job = await queue.add("book", { userId });
    logger.info(`Booking job enqueued: Queue = ${queueName}, Job ID = ${job.id}, User ID = ${userId}`);

    // Dynamically start worker if not already running
    startBookingWorker(prisma, cache, sessionId);

    return job;
}

function startBookingWorker(prisma, cache, sessionId) {
    if (!Worker || !connection) return;

    const existing = activeWorkers.get(sessionId);
    if (existing) {
        if (existing.idleTimeout) {
            clearTimeout(existing.idleTimeout);
            existing.idleTimeout = null;
            logger.info(`Cleared idle timeout for session worker: ${sessionId}`);
        }
        return;
    }

    logger.info(`Starting dynamic booking worker for session: ${sessionId}`);
    const queueName = `booking-${sessionId}`;
    const workerConnection = getRedisConnection(); // Workers need their own connection for blocking pop operations

    const worker = new Worker(queueName, async (job) => {
        const { userId } = job.data;
        const sessionService = require("../services/sessionService");

        try {
            // Call the core booking transaction logic
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
        }
    }, {
        connection: workerConnection,
        concurrency: 1 // Crucial: Process sequentially to eliminate race conditions
    });

    const workerEntry = {
        worker,
        workerConnection,
        idleTimeout: null
    };
    activeWorkers.set(sessionId, workerEntry);

    worker.on("active", (job) => {
        logger.info(`Worker for session ${sessionId} is active on job ${job.id}`);
        const entry = activeWorkers.get(sessionId);
        if (entry && entry.idleTimeout) {
            clearTimeout(entry.idleTimeout);
            entry.idleTimeout = null;
            logger.info(`Cleared idle timeout for active worker on session: ${sessionId}`);
        }
    });

    worker.on("drained", () => {
        logger.info(`Queue drained. Scheduling idle timeout for session worker: ${sessionId}`);
        const entry = activeWorkers.get(sessionId);
        if (entry) {
            if (entry.idleTimeout) clearTimeout(entry.idleTimeout);
            entry.idleTimeout = setTimeout(async () => {
                logger.info(`Idle timeout reached. Stopping worker for session: ${sessionId}`);
                try {
                    activeWorkers.delete(sessionId);
                    await entry.worker.close();
                    await entry.workerConnection.quit();
                } catch (err) {
                    logger.error(`Error closing worker connection for session ${sessionId}: ${err.message}`);
                }
            }, 10000); // 10 seconds idle timeout
        }
    });

    worker.on("failed", (job, err) => {
        logger.error(`Booking worker job failed: ID = ${job.id}. Error: ${err.message}`);
    });
}

module.exports = {
    addBookingJob
};
