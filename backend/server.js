const express = require("express");
const cors = require("cors");
const compression = require("compression");
const NodeCache = require("node-cache");
const config = require("./config");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const socialRoutes = require("./routes/social");
const sessionRoutes = require("./routes/session");
const quizRoutes = require('./routes/quiz');
const resourceRoutes = require('./routes/resource');
const reviewRoutes = require('./routes/reviews');
const codingChallengeRoutes = require('./routes/codingChallengeRoutes');
const { generalLimiter } = require("./middleware/rateLimiter");

const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});
const cache = new NodeCache({ stdTTL: 600 });

app.use(compression());

const allowedOrigins = [
  'http://localhost:5173',
  'https://zenova-x.vercel.app',
  'https://zenova-x-server.vercel.app'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Check if the origin starts with any of the allowed origins (to handle trailing slashes)
    const isAllowed = allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// Enable pre-flight for all routes
app.options('*', cors());

app.use(express.json({ limit: '50kb' }));
app.use("/api", generalLimiter);

app.use((req, res, next) => {
  req.prisma = prisma;
  req.cache = cache;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coding-questions", codingChallengeRoutes);
app.use("/api/reports", require("./routes/reports"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/help", require("./routes/helpRoutes"));

const PORT = config.port;

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: config.nodeEnv === 'development' ? err.message : undefined
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
