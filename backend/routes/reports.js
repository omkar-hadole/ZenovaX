const express = require('express');
const router = express.Router();
const { createReport, getReportsForMentor } = require('../controllers/reportController');
const { protect, authorize, requireProfileComplete } = require('../middleware/auth');

router.use(protect, requireProfileComplete);

// POST /api/reports/create - Create a new report
router.post('/create', createReport);

// GET /api/reports/my-reports - Get reports for mentor's sessions
router.get('/my-reports', authorize('MENTOR', 'BOTH'), getReportsForMentor);

module.exports = router;
