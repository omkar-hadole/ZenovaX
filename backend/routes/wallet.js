const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const walletController = require("../controllers/walletController");

const router = express.Router();

router.get("/me", protect, authorize('MENTOR', 'BOTH'), walletController.getWalletSummary);

router.get("/payout-account", protect, authorize('MENTOR', 'BOTH'), walletController.getPayoutAccount);
router.put("/payout-account", protect, authorize('MENTOR', 'BOTH'), walletController.upsertPayoutAccount);

router.post("/payouts", protect, authorize('MENTOR', 'BOTH'), walletController.requestPayout);
router.get("/payouts", protect, authorize('MENTOR', 'BOTH'), walletController.getPayoutHistory);

router.put("/payouts/:id/paid", protect, authorize('ADMIN'), walletController.markPayoutPaid);
router.put("/payouts/:id/failed", protect, authorize('ADMIN'), walletController.markPayoutFailed);

module.exports = router;
