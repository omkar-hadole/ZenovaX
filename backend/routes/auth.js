const express = require("express");
const authController = require("../controllers/authController");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post("/register", registerLimiter, authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.get("/csrf", authController.getCsrfToken);

module.exports = router;