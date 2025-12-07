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

const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});
const cache = new NodeCache({ stdTTL: 600 });

app.use(compression());
app.use(cors());
app.use(express.json());

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
app.use("/api/admin", require("./routes/adminRoutes"));

const PORT = config.port;

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: config.nodeEnv === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {

});
