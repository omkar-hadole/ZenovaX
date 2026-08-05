const express = require("express");
const router = express.Router();
const helpController = require("../controllers/helpController");
const { protect, requireProfileComplete } = require("../middleware/auth");
const { aiLimiter } = require("../middleware/rateLimiter");

// All AI/help endpoints are consumed inside authenticated pages only, so they
// require a logged-in, profile-complete user.
router.use(protect, requireProfileComplete);

// Gemini calls are slow and cost money — a per-user quota on top of the
// general per-IP limiter so a single account can't rack up unbounded AI spend.
router.use(aiLimiter);

router.post("/ask-ai", helpController.askAI);
router.post("/ask-ai-chatgpt", helpController.askAIWithChatGPT);
router.post("/generate-question", helpController.generateCodingQuestion);
router.post("/ask-code-debugger", helpController.askCodeDebugger);

module.exports = router;
