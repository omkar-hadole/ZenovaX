const Redis = require("ioredis");
const NodeCache = require("node-cache");
const logger = require("./logger");
const config = require("../config");

let redisClient = null;

const isProduction = config.nodeEnv === 'production';
const redisUrl = config.redisUrl || process.env.REDIS_URL;

if (redisUrl && redisUrl.trim()) {
    try {
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            connectTimeout: 5000,
            lazyConnect: true,
            retryStrategy(times) {
                // Exponential backoff up to 3000ms
                const delay = Math.min(times * 100, 3000);
                return delay;
            }
        });

        redisClient.on("error", (err) => {
            if (isProduction) {
                logger.error(`CRITICAL: Redis Error in production: ${err.message}`);
            } else {
                logger.error(`Redis Error: ${err.message}`);
            }
        });

        redisClient.on("connect", () => {
            logger.info("Redis connected successfully.");
        });

        redisClient.connect().catch((err) => {
            if (isProduction) {
                logger.error(`CRITICAL: Redis initial connection failed in production: ${err.message}`);
            } else {
                logger.error(`Redis connection failed: ${err.message}`);
                redisClient = null;
            }
        });
    } catch (err) {
        if (isProduction) {
            logger.error(`CRITICAL: Failed to initialize Redis in production: ${err.message}`);
        } else {
            logger.error(`Failed to initialize Redis: ${err.message}`);
            redisClient = null;
        }
    }
} else {
    if (isProduction) {
        logger.error("CRITICAL: REDIS_URL not set in production! Caching will be disabled.");
    } else {
        logger.warn("REDIS_URL not set. Falling back to in-memory NodeCache.");
    }
}

const fallbackCache = new NodeCache({ stdTTL: 600 });

const cache = {
    isRedisAvailable() {
        return !!(redisClient && redisClient.status === 'ready');
    },

    async get(key) {
        if (this.isRedisAvailable()) {
            try {
                const data = await redisClient.get(key);
                return data ? JSON.parse(data) : undefined;
            } catch (err) {
                logger.error(`Redis get error for key ${key}: ${err.message}`);
                if (isProduction) return undefined;
            }
        }
        if (isProduction) return undefined;
        return fallbackCache.get(key);
    },

    async set(key, value, ttlSeconds = 600) {
        if (this.isRedisAvailable()) {
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
                if (isProduction) return false;
            }
        }
        if (isProduction) return false;
        return fallbackCache.set(key, value, ttlSeconds);
    },

    async del(key) {
        if (this.isRedisAvailable()) {
            try {
                await redisClient.del(key);
                return true;
            } catch (err) {
                logger.error(`Redis del error for key ${key}: ${err.message}`);
                if (isProduction) return false;
            }
        }
        if (isProduction) return false;
        return fallbackCache.del(key);
    },

    async has(key) {
        if (this.isRedisAvailable()) {
            try {
                const exists = await redisClient.exists(key);
                return exists === 1;
            } catch (err) {
                logger.error(`Redis has error for key ${key}: ${err.message}`);
                if (isProduction) return false;
            }
        }
        if (isProduction) return false;
        return fallbackCache.has(key);
    },

    async delPattern(pattern) {
        if (this.isRedisAvailable()) {
            try {
                const stream = redisClient.scanStream({
                    match: pattern,
                    count: 100
                });

                let deletedCount = 0;

                await new Promise((resolve, reject) => {
                    stream.on("data", (keys) => {
                        if (keys && keys.length > 0) {
                            stream.pause();
                            redisClient.del(keys)
                                .then(() => {
                                    deletedCount += keys.length;
                                    stream.resume();
                                })
                                .catch((err) => {
                                    logger.error(`Redis scanStream del error: ${err.message}`);
                                    stream.resume();
                                });
                        }
                    });

                    stream.on("end", () => {
                        resolve();
                    });

                    stream.on("error", (err) => {
                        reject(err);
                    });
                });

                logger.info(`Redis pattern del for "${pattern}" deleted ${deletedCount} keys.`);
                return true;
            } catch (err) {
                logger.error(`Redis delPattern error for ${pattern}: ${err.message}`);
                if (isProduction) return false;
            }
        }
        if (isProduction) return false;

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
