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
            retryStrategy() {
                return null;
            }
        });

        redisClient.on("error", () => {});

        redisClient.connect().catch(() => {
            redisClient = null;
        });
    } catch {
        redisClient = null;
    }
} else {
    if (isProduction) {
        logger.error("CRITICAL: REDIS_URL not set in production! Caching will be disabled.");
    } else {
        logger.warn("REDIS_URL not set. Falling back to in-memory NodeCache.");
    }
}

const fallbackCache = new NodeCache({ stdTTL: 900 });

const counters = {
  get: 0,
  set: 0,
  del: 0,
  hit: 0,
  miss: 0,
  pattern: 0,
};

const logStats = () => {
  const total = counters.get + counters.set + counters.del + counters.pattern;
  const hitRate = total > 0 ? ((counters.hit / (counters.hit + counters.miss)) * 100).toFixed(1) : 'N/A';
  logger.info(`[Cache Stats] GET:${counters.get} SET:${counters.set} DEL:${counters.del} PATTERN:${counters.pattern} HIT:${counters.hit} MISS:${counters.miss} HIT_RATE:${hitRate}%`);
  counters.get = 0;
  counters.set = 0;
  counters.del = 0;
  counters.hit = 0;
  counters.miss = 0;
  counters.pattern = 0;
};

if (!isProduction) {
  setInterval(logStats, 300000);
}

const cache = {
    isRedisAvailable() {
        return !!(redisClient && redisClient.status === 'ready');
    },

    async get(key) {
        if (!isProduction) counters.get++;
        if (this.isRedisAvailable()) {
            try {
                const data = await redisClient.get(key);
                if (!isProduction) {
                  if (data !== null) counters.hit++; else counters.miss++;
                }
                return data ? JSON.parse(data) : undefined;
            } catch (err) {
                logger.error(`Redis get error for key ${key}: ${err.message}`);
                if (!isProduction) counters.miss++;
                if (isProduction) return undefined;
            }
        }
        if (isProduction) return undefined;
        const val = fallbackCache.get(key);
        if (!isProduction) {
          if (val !== undefined) counters.hit++; else counters.miss++;
        }
        return val;
    },

    async set(key, value, ttlSeconds = 900) {
        if (!isProduction) counters.set++;
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
        if (!isProduction) counters.del++;
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
        if (!isProduction) counters.get++;
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
        if (!isProduction) counters.pattern++;
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

        const keys = fallbackCache.keys();
        const matches = keys.filter(k => k.includes(pattern.replace('*', '')));
        for (const k of matches) {
            fallbackCache.del(k);
        }
        logger.info(`NodeCache pattern del for "${pattern}" deleted ${matches.length} keys.`);
        return true;
    }
};

cache.redisClient = redisClient;

module.exports = cache;
