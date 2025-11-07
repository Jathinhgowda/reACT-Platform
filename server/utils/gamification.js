// server/utils/gamification.js
const User = require('../models/User');

const POINTS_MAP = {
  REPORT_ISSUE: 10,
  VERIFY_ISSUE: 2,
  COMMENT: 1,
  RESOLUTION_BONUS: 25, // Bonus for reporter when issue is resolved
};

/**
 * Adds points to a user based on the action performed.
 */
exports.addPoints = async (userId, actionType) => {
  if (!POINTS_MAP[actionType]) return;

  try {
    const pointsToAdd = POINTS_MAP[actionType];
    const user = await User.findById(userId);

    if (user) {
      user.points += pointsToAdd;

      // Update impact score (simple calculation for MVP)
      user.impactScore = user.points + (user.streak * 5);

      // Simple streak update (could be middleware later)
      const today = new Date().toDateString();
      const lastActive = user.lastActivityDate ? user.lastActivityDate.toDateString() : null;

      if (lastActive !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString(); // 24 hours ago
        if (lastActive === yesterday) {
          user.streak += 1;
        } else {
          user.streak = 1; 
        }
        user.lastActivityDate = Date.now();
      }

      await user.save();
    }
  } catch (error) {
    console.error(`Error awarding points to user ${userId}:`, error.message);
  }
};

/**
 * Awards resolution bonus to the reporter of an issue.
 * Call this when an issue is marked as 'Resolved'.
 */
exports.awardResolutionPoints = async (issue) => {
  try {
    if (!issue?.reporter) return;

    const reporterId = issue.reporter.toString(); // assuming reporter is a Mongo ObjectId
    const user = await User.findById(reporterId);

    if (user) {
      user.points += POINTS_MAP.RESOLUTION_BONUS;

      // Update impact score
      user.impactScore = user.points + (user.streak * 5);

      await user.save();
      console.log(`Resolution bonus awarded to user ${reporterId}`);
    }
  } catch (error) {
    console.error(`Error awarding resolution bonus for issue ${issue._id}:`, error.message);
  }
};
