// server/controllers/adminController.js

const Campaign = require('../models/Campaign');
const Quiz = require('../models/Quiz');

// ------------------------------------
// --- Campaign Management ---
// ------------------------------------

/**
 * @desc    Admin: Create a new campaign
 * @route   POST /api/admin/campaigns
 * * FIX: Implemented logic to prevent hanging and handle date validation.
 */
exports.createCampaign = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        
        // 1. INPUT VALIDATION: Crucial to prevent Mongoose hang on invalid dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start) || isNaN(end)) {
             return res.status(400).json({ message: 'Invalid start or end date format provided.' });
        }
        if (start >= end) {
            return res.status(400).json({ message: 'Start date must be before end date.' });
        }
        
        // 2. Document Creation
        const campaign = new Campaign(req.body);
        await campaign.save(); 
        
        // 3. Success Response
        res.status(201).json({ 
            message: 'Campaign created successfully!',
            campaign: campaign 
        });
        
    } catch (error) {
        console.error("Mongoose or Server Error creating campaign:", error.message, error.stack); 
        
        // Handle Mongoose Validation Error (missing required fields)
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: 'Validation failed: Please ensure all required fields are filled correctly.' });
        }
        
        // General Error Response (This ensures the frontend doesn't hang)
        res.status(500).json({ message: 'Internal server error during campaign creation.' });
    }
};

// @desc    Admin: Get Campaign by ID (Existing function remains)
exports.getCampaignById = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id);
        if (!campaign) return res.status(404).json({ message: 'Campaign not found.' });
        res.status(200).json(campaign);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching campaign.', details: error.message });
    }
};

// @desc    Admin: Update an existing campaign (Existing function remains)
exports.updateCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { 
            new: true, runValidators: true 
        });
        if (!campaign) return res.status(404).json({ message: 'Campaign not found.' });
        res.status(200).json({ message: 'Campaign updated successfully!', campaign });
    } catch (error) {
        res.status(400).json({ message: 'Error updating campaign.', details: error.message });
    }
};

// @desc    Admin: Delete a campaign (Existing function remains)
exports.deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndDelete(req.params.id);
        if (!campaign) return res.status(404).json({ message: 'Campaign not found.' });
        res.status(200).json({ message: 'Campaign deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting campaign.', details: error.message });
    }
};

// ------------------------------------
// --- Quiz Management ---
// ------------------------------------

/**
 * @desc    Admin: Create a new quiz
 * @route   POST /api/admin/quizzes
 * * FIX: Implemented logic to ensure response is sent.
 */
exports.createQuiz = async (req, res) => {
    // Basic validation to ensure questions array exists and has options
    if (!req.body.questions || req.body.questions.length === 0) {
         return res.status(400).json({ message: 'Quiz must contain at least one question.' });
    }

    try {
        const quiz = new Quiz(req.body);
        await quiz.save();
        res.status(201).json({ 
            message: 'Quiz created successfully!',
            quiz: quiz 
        });
    } catch (error) {
        console.error("Error creating quiz:", error);
        res.status(400).json({ message: 'Error creating quiz.', details: error.message });
    }
};

// @desc    Admin: Get Quiz by ID (Existing function remains)
exports.getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
        res.status(200).json(quiz);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching quiz.', details: error.message });
    }
};

// @desc    Admin: Update an existing quiz (Existing function remains)
exports.updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { 
            new: true, 
            runValidators: true 
        });
        if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
        res.status(200).json({ message: 'Quiz updated successfully!', quiz });
    } catch (error) {
        res.status(400).json({ message: 'Error updating quiz.', details: error.message });
    }
};

// @desc    Admin: Delete a quiz (Existing function remains)
exports.deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
        res.status(200).json({ message: 'Quiz deleted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting quiz.', details: error.message });
    }
};