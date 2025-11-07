// server/routes/analyticsRoutes.js

const express = require('express');
const router = express.Router();
const { getIssueSummary, getGeoAnalytics } = require('../controllers/analyticsController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');

// Dashboard summary data (Admin/Authority only)
router.get('/summary', protect, authorize(['Authority', 'Admin']), getIssueSummary);

// Geo data for heatmap (Public)
router.get('/geo', getGeoAnalytics);

module.exports = router;