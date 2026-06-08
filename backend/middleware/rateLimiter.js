const rateLimit = require('express-rate-limit');

// Strict rate limiter for login: 10 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for registration: 5 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: "Too many accounts created from this IP. Please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiter: 100 requests per minute per IP for all other API routes
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip general rate limiting for login and register routes since they have stricter limits
    const path = req.originalUrl || '';
    return path.includes('/api/auth/login') || path.includes('/api/auth/register');
  }
});

module.exports = {
  loginLimiter,
  registerLimiter,
  generalLimiter
};
