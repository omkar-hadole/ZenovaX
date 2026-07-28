const express = require("express");
const { protect, authorize, requireProfileComplete } = require("../middleware/auth");
const walletController = require("../controllers/walletController");

const router = express.Router();

router.use(protect, requireProfileComplete);

router.get("/me", authorize('MENTOR', 'BOTH'), walletController.getWalletSummary);

router.get("/payout-account", authorize('MENTOR', 'BOTH'), walletController.getPayoutAccount);
router.put("/payout-account", authorize('MENTOR', 'BOTH'), walletController.upsertPayoutAccount);

router.post("/payouts", authorize('MENTOR', 'BOTH'), walletController.requestPayout);
router.get("/payouts", authorize('MENTOR', 'BOTH'), walletController.getPayoutHistory);

// Admin payout finalization lives under /api/admin (see adminRoutes.js).

module.exports = router;
