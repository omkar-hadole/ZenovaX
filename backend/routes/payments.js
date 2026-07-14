const express = require("express");
const { protect } = require("../middleware/auth");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

// Public-to-authenticated: lets the client know whether to run real checkout.
router.get("/config", protect, paymentController.getConfig);

module.exports = router;
