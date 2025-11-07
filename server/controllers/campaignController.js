// server/controllers/campaignController.js

const Campaign = require('../models/Campaign');
const { addPoints } = require('../utils/gamification');

// @desc    Get all active campaigns (with user status if logged in)
// @route   GET /api/campaigns
// @access  Public (Checks auth status)
exports.getActiveCampaigns = async (req, res) => {
    try {
        const activeCampaigns = await Campaign.find({ 
            endDate: { $gte: new Date() } // Only retrieve campaigns that have not ended
        }).sort({ startDate: 1 });

        // If user is logged in (req.user is set by the protect middleware on the route)
        if (req.user) {
            const userId = req.user._id;
            
            // Map campaigns to include user-specific status (isJoined, userProgress)
            const campaignsWithStatus = activeCampaigns.map(campaign => {
                const campaignObj = campaign.toObject();
                // Find user's participation entry
                const participant = campaignObj.participants.find(p => p.userId.toString() === userId.toString());
                
                return {
                    ...campaignObj,
                    isJoined: !!participant, // true if participant object exists
                    userProgress: participant ? participant.progress : 0,
                };
            });
            return res.status(200).json(campaignsWithStatus);
        }

        // Return basic list if not logged in
        res.status(200).json(activeCampaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        res.status(500).json({ message: 'Failed to fetch campaigns.' });
    }
};

// @desc    User joins a campaign
// @route   POST /api/campaigns/:id/join
// @access  Private
exports.joinCampaign = async (req, res) => {
    try {
        const campaignId = req.params.id;
        const userId = req.user._id;

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found.' });
        }
        
        // Check if the campaign is active
        if (campaign.endDate < new Date()) {
            return res.status(400).json({ message: 'This campaign has already ended.' });
        }

        // Use Mongoose update to check and push participant atomically
        const result = await Campaign.updateOne(
            { 
                _id: campaignId, 
                'participants.userId': { $ne: userId } // Ensure user is NOT already in the array
            },
            {
                $push: { participants: { userId, progress: 0, isComplete: false } }
            }
        );

        if (result.nModified === 0 && result.nMatched === 1) {
             // nModified might be 0 if the user was already present (though checked by $ne)
             // or if another atomic operation failed. For simplicity, we assume 
             // matched=1 and modified=0 means already joined.
             const existingParticipant = campaign.participants.find(p => p.userId.toString() === userId.toString());
             if (existingParticipant) {
                return res.status(400).json({ message: 'You have already joined this campaign.', isJoined: true });
             }
        }
        
        if (result.modifiedCount === 0) {
            // Handle case where campaign might have ended between fetch and join
             return res.status(400).json({ message: 'Could not join campaign. It may have already been joined or ended.' });
        }


        res.status(200).json({ message: 'Successfully joined campaign!', isJoined: true });
    } catch (error) {
        console.error('Error joining campaign:', error);
        // Handle potential duplicate key error (if concurrent join attempts happen)
        if (error.code === 11000) { 
            return res.status(400).json({ message: 'You are already registered for this campaign.' });
        }
        res.status(500).json({ message: 'Failed to join campaign.' });
    }
};

// @desc    Admin: Create a new campaign (Remains the same)
// @route   POST /api/campaigns
// @access  Private/Admin
exports.createCampaign = async (req, res) => {
    // ... (Logic from adminController.js)
};

// --- Exports ---
exports.getActiveCampaigns = exports.getActiveCampaigns;
exports.joinCampaign = exports.joinCampaign;
exports.createCampaign = exports.createCampaign;