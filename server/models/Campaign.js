// server/models/Campaign.js (Modified)

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  
  targetAction: { type: String, enum: ['Report', 'Verify', 'Comment', 'Custom'], required: true },
  targetGoal: { type: Number, default: 1 },
  rewardPoints: { type: Number, default: 50 },
  rewardBadge: { type: String, default: 'Campaign Contributor' },

  // NEW: Array to track participants and their progress
  participants: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    progress: { type: Number, default: 0 }, // Current count of actions completed by user
    isComplete: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Campaign', campaignSchema);