const jwt = require("jsonwebtoken");
const config = require("../config");

function auth(req, res, next) {
  const authHeader = req.headers.authorization;


  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }


  const token = authHeader.slice(7);

  try {

    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

const protect = auth;

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

module.exports = { protect, authorize };
