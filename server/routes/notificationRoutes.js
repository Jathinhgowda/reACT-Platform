// server/routes/notificationRoutes.js

const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const User = require('../models/User');

// @desc    Store a user's push subscription
// @route   POST /api/notifications/subscribe
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
    try {
        const subscription = req.body;
        
        // Find user by ID from JWT (set by 'protect' middleware)
        await User.findByIdAndUpdate(req.user.id, { subscription: subscription });
        
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Subscription failed:', error);
        res.status(500).json({ message: 'Failed to save subscription.' });
    }
});

module.exports = router;