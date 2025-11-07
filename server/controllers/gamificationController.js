// server/controllers/gamificationController.js

const User = require('../models/User');

// @desc    Get the global leaderboard
// @route   GET /api/gamification/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ role: 'Citizen' })
      .select('username points streak impactScore') // Select only public, relevant fields
      .sort({ impactScore: -1, points: -1 }) // Sort by impact score, then points
      .limit(50); // Top 50

    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leaderboard' });
  }
};