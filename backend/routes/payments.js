const express = require("express");
const { protect, requireProfileComplete } = require("../middleware/auth");
const paymentController = require("../controllers/paymentController");

const router = express.Router();

router.use(protect, requireProfileComplete);

// Public-to-authenticated: lets the client know whether to run real checkout.
router.get("/config", paymentController.getConfig);

module.exports = router;
