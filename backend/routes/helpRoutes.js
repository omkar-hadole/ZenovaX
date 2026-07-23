const express = require("express");
const router = express.Router();
const helpController = require("../controllers/helpController");

router.post("/ask-ai", helpController.askAI);
router.post("/ask-ai-chatgpt", helpController.askAIWithChatGPT);

module.exports = router;
