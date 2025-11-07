// server/routes/campaignRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getActiveCampaigns, 
  createCampaign, 
  joinCampaign 
} = require('../controllers/campaignController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');

// GET /api/campaigns - Fetches active campaigns (passes user if logged in)
router.get('/', protect, getActiveCampaigns); 

// POST /api/campaigns/:id/join - User joins a campaign (Requires login)
router.post('/:id/join', protect, joinCampaign); // <-- NEW ROUTE

// POST /api/campaigns - Admin creates a campaign (Requires Admin role)
router.post('/', protect, authorize(['Admin']), createCampaign);

module.exports = router;