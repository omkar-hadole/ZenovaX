const Redis = require("ioredis");
const NodeCache = require("node-cache");
const logger = require("./logger");
const config = require("../config");

let redisClient = null;

// Read REDIS_URL from config or environment variables
const redisUrl = config.redisUrl || process.env.REDIS_URL;

if (redisUrl && redisUrl.trim()) {
    try {
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            connectTimeout: 5000,
            lazyConnect: true
        });

        redisClient.on("error", (err) => {
            logger.error(`Redis Error: ${err.message}`);
        });

        redisClient.on("connect", () => {
            logger.info("Redis connected successfully.");
        });

        redisClient.connect().catch((err) => {
            logger.error(`Redis connection failed: ${err.message}`);
            redisClient = null;
        });
    } catch (err) {
        logger.error(`Failed to initialize Redis: ${err.message}`);
        redisClient = null;
    }
} else {
    logger.warn("REDIS_URL not set. Falling back to in-memory NodeCache.");
}

const fallbackCache = new NodeCache({ stdTTL: 600 });

const cache = {
    async get(key) {
        if (redisClient) {
            try {
                const data = await redisClient.get(key);
                return data ? JSON.parse(data) : undefined;
            } catch (err) {
                logger.error(`Redis get error for key ${key}: ${err.message}`);
            }
        }
        return fallbackCache.get(key);
    },

    async set(key, value, ttlSeconds = 600) {
        if (redisClient) {
            try {
                const data = JSON.stringify(value);
                if (ttlSeconds) {
                    await redisClient.set(key, data, "EX", ttlSeconds);
                } else {
                    await redisClient.set(key, data);
                }
                return true;
            } catch (err) {
                logger.error(`Redis set error for key ${key}: ${err.message}`);
            }
        }
        return fallbackCache.set(key, value, ttlSeconds);
    },

    async del(key) {
        if (redisClient) {
            try {
                await redisClient.del(key);
                return true;
            } catch (err) {
                logger.error(`Redis del error for key ${key}: ${err.message}`);
            }
        }
        return fallbackCache.del(key);
    },

    async has(key) {
        if (redisClient) {
            try {
                const exists = await redisClient.exists(key);
                return exists === 1;
            } catch (err) {
                logger.error(`Redis has error for key ${key}: ${err.message}`);
            }
        }
        return fallbackCache.has(key);
    },

    async delPattern(pattern) {
        if (redisClient) {
            try {
                const keys = await redisClient.keys(pattern);
                if (keys.length > 0) {
                    await redisClient.del(keys);
                }
                logger.info(`Redis pattern del for "${pattern}" deleted ${keys.length} keys.`);
                return true;
            } catch (err) {
                logger.error(`Redis delPattern error for ${pattern}: ${err.message}`);
            }
        }
        // Fallback pattern matching
        const keys = fallbackCache.keys();
        const matches = keys.filter(k => k.includes(pattern.replace('*', '')));
        for (const k of matches) {
            fallbackCache.del(k);
        }
        logger.info(`NodeCache pattern del for "${pattern}" deleted ${matches.length} keys.`);
        return true;
    }
};

module.exports = cache;
