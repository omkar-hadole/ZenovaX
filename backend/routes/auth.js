const express = require("express");
const authController = require("../controllers/authController");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerLimiter, authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.post("/change-password", protect, authController.changePassword);
router.get("/csrf", authController.getCsrfToken);

router.get("/sessions", protect, authController.getSessions);
router.delete("/sessions/:id", protect, authController.revokeSession);
router.delete("/sessions", protect, authController.revokeAllSessions);

module.exports = router;