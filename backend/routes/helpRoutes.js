const express = require("express");
const router = express.Router();
const helpController = require("../controllers/helpController");
const { protect, requireProfileComplete } = require("../middleware/auth");

// All AI/help endpoints are consumed inside authenticated pages only, so they
// require a logged-in, profile-complete user.
router.use(protect, requireProfileComplete);

router.post("/ask-ai", helpController.askAI);
router.post("/ask-ai-chatgpt", helpController.askAIWithChatGPT);
router.post("/generate-question", helpController.generateCodingQuestion);
router.post("/ask-code-debugger", helpController.askCodeDebugger);

module.exports = router;
