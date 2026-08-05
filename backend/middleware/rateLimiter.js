const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { ipKeyGenerator } = require('express-rate-limit');
const cache = require('../utils/cache');
const config = require('../config');

// Rate limits must be shared across all Lambda instances, otherwise each warm
// instance keeps its own in-memory counters and the limits become a no-op. Use
// Redis when it's available; fall back to per-instance memory if not.
const redisAvailable = cache.isRedisAvailable();

const makeStore = (prefix) => {
    if (redisAvailable && cache.redisClient) {
        return new RedisStore({
            prefix,
            sendCommand: (...args) => cache.redisClient.call(...args),
        });
    }
    return undefined; // express-rate-limit falls back to its MemoryStore
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'development' ? 100 : 10,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:login:'),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: config.nodeEnv === 'development' ? 50 : 5,
  message: { error: "Too many accounts created from this IP. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:register:'),
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many password reset requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:forgot:'),
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many password reset attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:reset:'),
});

const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many verification attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:verify:'),
});

const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Too many resend requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:resend:'),
});

const refreshLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: config.nodeEnv === 'development' ? 200 : 20,
  message: { error: "Too many refresh requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:refresh:'),
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: config.nodeEnv === 'development' ? 1000 : 100,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:general:'),
  skip: (req) => {
    const path = req.originalUrl || '';
    return path.includes('/api/auth/login') || path.includes('/api/auth/register');
  }
});

// Per-user quota for the expensive AI endpoints (Gemini). Keyed by the verified
// user id (set by `protect`) rather than IP so one user can't hammer the AI and
// rack up Gemini costs across IPs. Falls back to IP if no user is present.
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: config.nodeEnv === 'development' ? 60 : 10,
  message: { error: "Too many AI requests. Please wait a moment before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('rl:ai:'),
  keyGenerator: (req) => (req.user && req.user.id) || ipKeyGenerator(req.ip) || 'anon',
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verifyEmailLimiter,
  resendVerificationLimiter,
  refreshLimiter,
  generalLimiter,
  aiLimiter
};
