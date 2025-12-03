const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

// Apply auth and adminAuth middleware to all routes
router.use(auth);
router.use(adminAuth);

// Dashboard Stats
router.get('/stats', adminController.getDashboardStats);

// Pending Sessions
router.get('/pending-sessions', adminController.getPendingSessions);
router.post('/approve-session', adminController.approveSession);
router.post('/reject-session', adminController.rejectSession);

// All Sessions
router.get('/sessions', adminController.getAllSessions);
router.delete('/sessions/:id', adminController.deleteSession);

// Users
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

// Reports
router.get('/reports', adminController.getReports);
router.post('/reports/action', adminController.handleReportAction);

module.exports = router;
