const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardData } = require('../controllers/dashboardController');

// GET /api/dashboard - Fetch all dashboard datasets
router.get('/', protect, getDashboardData);

module.exports = router;
