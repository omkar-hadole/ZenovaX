const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const cache = require('../utils/cache');
const config = require('../config');

const redisClient = cache.redisClient;

// Helper to create a new RedisStore instance for each limiter
const createRedisStore = (prefix) => {
  return cache.isRedisAvailable() ? new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: `rl:${prefix}:`,
  }) : undefined;
};

// Strict rate limiter for login: 10 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'development' ? 100 : 10,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('login'),
});

// Strict rate limiter for registration: 5 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: config.nodeEnv === 'development' ? 50 : 5,
  message: { error: "Too many accounts created from this IP. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('register'),
});

// Rate limiter for forgot-password: 5 requests per 15 minutes per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many password reset requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('forgot-password'),
});

// Rate limiter for reset-password: 5 requests per 15 minutes per IP
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many password reset attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('reset-password'),
});

// Rate limiter for verify-email: 10 requests per 15 minutes per IP
const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many verification attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('verify-email'),
});

// Rate limiter for resend-verification: 3 requests per 15 minutes per IP
const resendVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Too many resend requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('resend-verification'),
});

// Rate limiter for refresh: 20 requests per minute per IP
const refreshLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: config.nodeEnv === 'development' ? 200 : 20,
  message: { error: "Too many refresh requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('refresh'),
});

// General rate limiter: 100 requests per minute per IP for all other API routes
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: config.nodeEnv === 'development' ? 1000 : 100,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('general'),
  skip: (req) => {
    const path = req.originalUrl || '';
    return path.includes('/api/auth/login') || path.includes('/api/auth/register');
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  verifyEmailLimiter,
  resendVerificationLimiter,
  refreshLimiter,
  generalLimiter
};
