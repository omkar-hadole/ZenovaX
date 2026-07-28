const express = require('express');
const router = express.Router();
const { protect, authorize, requireProfileComplete } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect, requireProfileComplete);
router.use(authorize('ADMIN'));

router.get('/stats', adminController.getDashboardStats);

router.get('/pending-sessions', adminController.getPendingSessions);
router.post('/approve-session', adminController.approveSession);
router.post('/reject-session', adminController.rejectSession);

router.get('/sessions', adminController.getAllSessions);
router.delete('/sessions/:id', adminController.deleteSession);

router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

router.get('/reports', adminController.getReports);
router.post('/reports/action', adminController.handleReportAction);

// Payments & payouts
router.get('/payments/overview', adminController.getPaymentsOverview);
router.get('/payments/leaderboard', adminController.getMentorLeaderboard);
router.get('/payout-accounts', adminController.getPayoutAccounts);
router.post('/payout-accounts/:id/verify', adminController.verifyPayoutAccount);
router.post('/payout-accounts/:id/reject', adminController.rejectPayoutAccount);
router.get('/payouts', adminController.getPayouts);
router.post('/payouts/:id/mark-paid', adminController.markPayoutPaid);
router.post('/payouts/:id/mark-failed', adminController.markPayoutFailed);

// Admin Push Notifications
router.post('/notifications/push', adminController.pushNotification);
router.get('/notifications/history', adminController.getNotificationHistory);
router.get('/notifications/sessions', adminController.getSessionsList);
router.get('/notifications/users/search', adminController.searchUsers);

module.exports = router;
