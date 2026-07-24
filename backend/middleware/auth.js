const { jwtVerify } = require("jose");
const config = require("../config");

async function auth(req, res, next) {
  let token = req.cookies ? req.cookies.token : null;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const secret = new TextEncoder().encode(config.jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    req.user = { id: payload.userId, role: payload.role };
    next();
  } catch (err) {
    if (err.code === "ERR_JWT_EXPIRED") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

const protect = auth;

// Like `protect`, but never rejects the request — populates req.user when a
// valid token is present (cookie or Bearer), otherwise just proceeds
// anonymously. For routes that should behave better for logged-in users
// without requiring login (e.g. Zen's personalized answers).
async function optionalAuth(req, res, next) {
  let token = req.cookies ? req.cookies.token : null;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return next();
  }

  try {
    const secret = new TextEncoder().encode(config.jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    req.user = { id: payload.userId, role: payload.role };
  } catch {
    // Missing/invalid/expired token — proceed anonymously rather than block.
  }
  next();
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

module.exports = { protect, optionalAuth, authorize };
