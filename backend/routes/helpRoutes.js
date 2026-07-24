const express = require("express");
const router = express.Router();
const helpController = require("../controllers/helpController");
const { optionalAuth } = require("../middleware/auth");

router.post("/ask-ai", optionalAuth, helpController.askAI);
router.post("/ask-ai-chatgpt", optionalAuth, helpController.askAIWithChatGPT);
router.post("/ask-code-debugger", optionalAuth, helpController.askCodeDebugger);

module.exports = router;
