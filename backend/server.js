const express = require("express"); // Trigger nodemon reload
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const cache = require("./utils/cache");
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
const logger = require("./utils/logger");

const prisma = require("./utils/db");

const app = express();

app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.piston.dev"]
    }
  })
);
app.use(compression());
app.use(cookieParser());

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
app.use("/api/dashboard", require("./routes/dashboard"));

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (e) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// 404 Handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

const PORT = config.port;

app.use((err, req, res, next) => {
  logger.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Something went wrong!';
  res.status(statusCode).json({
    error: message,
    details: config.nodeEnv === 'development' ? err.message : undefined
  });
});

const { startQueueWorker } = require("./utils/queue");

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    startQueueWorker(prisma);
  });
}

module.exports = app;
