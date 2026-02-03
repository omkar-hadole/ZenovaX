const express = require("express");
const router = express.Router();
const helpController = require("../controllers/helpController");

router.post("/ask-ai", helpController.askAI);

module.exports = router;
