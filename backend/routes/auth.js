const express = require("express");
const authController = require("../controllers/authController");
const { loginLimiter, registerLimiter, forgotPasswordLimiter, resetPasswordLimiter, verifyEmailLimiter, resendVerificationLimiter, refreshLimiter } = require("../middleware/rateLimiter");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerLimiter, authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/verify-email", verifyEmailLimiter, authController.verifyEmail);
router.post("/resend-verification", resendVerificationLimiter, authController.resendVerification);
router.post("/logout", authController.logout);
router.post("/refresh", refreshLimiter, authController.refresh);
router.post("/forgot-password", forgotPasswordLimiter, authController.forgotPassword);
router.post("/reset-password", resetPasswordLimiter, authController.resetPassword);
router.post("/change-password", protect, authController.changePassword);
router.get("/csrf", authController.getCsrfToken);

router.get("/sessions", protect, authController.getSessions);
router.delete("/sessions/:id", protect, authController.revokeSession);
router.delete("/sessions", protect, authController.revokeAllSessions);

module.exports = router;