const express = require('express');
const router = express.Router();
const { protect, requireProfileComplete } = require('../middleware/auth');
const { getDashboardData } = require('../controllers/dashboardController');

router.use(protect, requireProfileComplete);

// GET /api/dashboard - Fetch all dashboard datasets
router.get('/', getDashboardData);

module.exports = router;
