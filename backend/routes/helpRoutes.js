const express = require("express");
const router = express.Router();
const helpController = require("../controllers/helpController");
const { optionalAuth } = require("../middleware/auth");

router.post("/ask-ai", optionalAuth, helpController.askAI);
router.post("/ask-ai-chatgpt", optionalAuth, helpController.askAIWithChatGPT);
router.post("/generate-question", optionalAuth, helpController.generateCodingQuestion);
// No optionalAuth here — the debugger doesn't use req.user/personalization
// at all, it's gated purely on the caller having a valid ChatGPT Bearer
// token (checked inside askCodeDebugger itself).
router.post("/ask-code-debugger", helpController.askCodeDebugger);

module.exports = router;
