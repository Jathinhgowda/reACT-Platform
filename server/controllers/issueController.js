// server/controllers/issueController.js

const Issue = require('../models/Issue');
const { addPoints } = require('../utils/gamification');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const webpush = require('web-push');

// ----------------------------------------
// Web Push Configuration (Helpers are defined locally)
// ----------------------------------------
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// --- Helper: Send Push Notification to Reporter ---
const sendNotificationToReporter = async (issueId, reporterId, newStatus) => {
  try {
    const reporter = await User.findById(reporterId);
    if (!reporter || !reporter.subscription) return;
    const payload = JSON.stringify({
      title: `Report Update: ${newStatus}`,
      body: `Your issue (ID: ${issueId.toString().substring(0, 8)}...) has been updated to "${newStatus}".`,
      url: `/issues/${issueId}`,
    });
    await webpush.sendNotification(reporter.subscription, payload);
  } catch (error) {
    if (error.statusCode === 410) {
      await User.updateOne({ _id: reporterId }, { $set: { subscription: null } });
    } else {
      console.error('Error sending push notification:', error);
    }
  }
};

// --- Helper: Update Campaign Progress ---
const updateCampaignProgress = async (userId, actionType) => {
  try {
    const activeCampaigns = await Campaign.find({
      targetAction: actionType,
      endDate: { $gte: new Date() },
    });

    for (const campaign of activeCampaigns) {
      const updateResult = await Campaign.updateOne(
        {
          _id: campaign._id,
          'participants.userId': userId,
          'participants.isComplete': false,
        },
        {
          $inc: { 'participants.$.progress': 1 },
        }
      );

      if (updateResult.modifiedCount > 0) {
        const updatedCampaign = await Campaign.findOne({ _id: campaign._id, 'participants.userId': userId });
        const participant = updatedCampaign.participants.find((p) => p.userId.toString() === userId.toString());

        if (participant && participant.progress >= campaign.targetGoal && !participant.isComplete) {
          await Campaign.updateOne(
            { _id: campaign._id, 'participants.userId': userId },
            { $set: { 'participants.$.isComplete': true } }
          );
          await addPoints(userId, 'CAMPAIGN_COMPLETE', campaign.rewardPoints);
          if (campaign.rewardBadge) {
            await User.updateOne(
              { _id: userId, badges: { $ne: campaign.rewardBadge } },
              { $push: { badges: campaign.rewardBadge } }
            );
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error updating campaign progress/reward for action ${actionType}:`, error);
  }
};


// ----------------------------------------
// 🧩 ISSUE CRUD & PUBLIC ACCESS
// ----------------------------------------

// CHANGE: Define functions using 'const'
const createIssue = async (req, res) => {
  const { title, description, category, userLat, userLon } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: 'Please fill in all required fields' });
  }

  let coordinates;
  if (userLat && userLon) {
    coordinates = [parseFloat(userLon), parseFloat(userLat)];
  } else if (req.exifCoords) {
    coordinates = req.exifCoords;
  } else {
    return res.status(400).json({ message: 'Location data (GPS) is required to report an issue.' });
  }

  try {
    const issue = await Issue.create({
      title, description, category, reporter: req.user.id, mediaUrl: req.mediaUrl,
      location: { type: 'Point', coordinates }, status: 'Pending',
      timeline: [{ status: 'Pending', comment: 'Issue reported.', user: req.user.id }],
    });

    await addPoints(req.user.id, 'REPORT_ISSUE');
    await updateCampaignProgress(req.user.id, 'Report');

    res.status(201).json(issue);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Server error when creating issue' });
  }
};

const getIssues = async (req, res) => {
  try {
    const issues = await Issue.find().populate('reporter', 'username role');
    res.status(200).json(issues);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ message: 'Server error when fetching issues' });
  }
};

const getIssueById = async (req, res) => {
    try {
        // 1. Fetch the document using standard Mongoose query
        const issue = await Issue.findById(req.params.id)
            .populate([
                { path: 'reporter', select: 'username role' },
                { path: 'comments.user', select: 'username' },
                { path: 'timeline.user', select: 'username' }
            ]);

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found.' });
        }
        
        // 2. CRITICAL FIX: Convert to a plain object to force serialization
        // This is the definitive way to ensure timeline.resolutionMediaUrl is included.
        const issueObject = issue.toObject({ virtuals: true, getters: true });

        // 3. Send the response
        res.status(200).json(issueObject); 
    } catch (error) {
        // Log the error to the console and send a standard 500
        console.error('SERVER ERROR (Issue Detail Retrieval):', error.stack);
        res.status(500).json({ message: 'A critical server error occurred while retrieving issue details.' });
    }
};
// ----------------------------------------
// 🧩 CITIZEN ACTIONS
// ----------------------------------------

const toggleVerification = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const userId = req.user.id;
    const isVerified = issue.verifications.includes(userId);

    if (!isVerified) {
      issue.verifications.push(userId);

      if (issue.verifications.length >= 5 && issue.status === 'Pending') {
        issue.status = 'Verified';
        issue.timeline.push({ status: 'Verified', comment: 'Community verified (5+ verifications).', user: req.user.id });
      }

      await addPoints(req.user.id, 'VERIFY_ISSUE');
      await updateCampaignProgress(req.user.id, 'Verify');
    } else {
      issue.verifications.pull(userId);
    }

    await issue.save();
    res.status(200).json({ verificationsCount: issue.verifications.length, newStatus: issue.status });
  } catch (error) {
    console.error('Error toggling verification:', error);
    res.status(500).json({ message: 'Server error when toggling verification' });
  }
};

const addComment = async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ message: 'Comment text is required.' });
  }

  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found.' });

    const comment = { user: req.user.id, text, date: new Date() };
    issue.comments.push(comment);
    await issue.save();

    await addPoints(req.user.id, 'COMMENT');
    await updateCampaignProgress(req.user.id, 'Comment');

    res.status(201).json({ message: 'Comment added successfully.', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error while adding comment.' });
  }
};

// ----------------------------------------
// 🧩 AUTHORITY/ADMIN ACTIONS
// ----------------------------------------

const updateIssueStatus = async (req, res) => {
  const { status, comment } = req.body;
  const validStatuses = ['Verified', 'In Progress', 'Resolved', 'Rejected'];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status provided.' });
  }

  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const oldStatus = issue.status;

    issue.status = status;
    issue.timeline.push({ status, comment: comment || `Status updated to ${status} by Authority/Admin.`, user: req.user.id, });

    await issue.save();

    if (status === 'Resolved' && oldStatus !== 'Resolved') {
      await addPoints(issue.reporter, 'RESOLUTION_BONUS');
    }

    if (oldStatus !== status) {
      await sendNotificationToReporter(issue._id, issue.reporter, status);
    }

    res.status(200).json(issue);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: 'Server error when updating status' });
  }
};

const updateResolutionStatus = async (req, res) => {
  const { status, comment } = req.body;
  console.log("URL received from middleware:", req.mediaUrl);

  // --- 1. Pre-Check: Enforce Requirements ---
  if (status !== 'Resolved' || !req.mediaUrl) {
    return res.status(400).json({ message: 'Status must be Resolved and resolution media is required.' });
  }

  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const oldStatus = issue.status; // Store the current status for comparison

    // 2. Apply Changes to Document
    issue.status = status;

    issue.timeline.push({
      status,
      comment: comment || 'Issue resolved by authority with photo proof.',
      user: req.user.id,
      resolutionMediaUrl: req.mediaUrl, // 👈 Cloudinary URL saved to timeline
    });

    // 3. Persist Changes
    await issue.save();
    
    // 4. AWARDS & NOTIFICATIONS (Conditional on status change)
    if (oldStatus !== 'Resolved') { // 🎯 CRITICAL FIX: Only award points if this is the first successful resolution
        // Award Reporter: Bonus points for successful resolution
        await addPoints(issue.reporter, 'RESOLUTION_BONUS');
        
        // Award Authority/Admin: Points for verifiable completion
        await addPoints(req.user.id, 'VERIFY_ISSUE'); 
        
        // Trigger push notification
        await sendNotificationToReporter(issue._id, issue.reporter, status);
        
        // Track campaign progress (e.g., for Authority challenge to resolve X issues)
        await updateCampaignProgress(req.user.id, 'Verify'); 
    }

    // 5. Final Response
    res.status(200).json(issue);
  } catch (error) {
    console.error('Error updating resolution status:', error);
    res.status(500).json({ message: 'Server error during resolution update.' });
  }
};

// ----------------------------------------
// 📦 FINAL EXPORTS
// ----------------------------------------

module.exports = {
    createIssue,
    getIssues,
    getIssueById, 
    updateIssueStatus,
    updateResolutionStatus, 
    toggleVerification,
    addComment,
};