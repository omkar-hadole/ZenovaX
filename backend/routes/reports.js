const express = require('express');
const router = express.Router();
const { createReport, getReportsForMentor } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

// POST /api/reports/create - Create a new report
router.post('/create', protect, createReport);

// GET /api/reports/my-reports - Get reports for mentor's sessions
router.get('/my-reports', protect, authorize('MENTOR', 'BOTH'), getReportsForMentor);

module.exports = router;
