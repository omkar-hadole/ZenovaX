const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(protect);
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

module.exports = router;
