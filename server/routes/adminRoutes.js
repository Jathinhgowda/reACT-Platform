// server/routes/adminRoutes.js (Partial Update)

const express = require('express');
const router = express.Router();
const { 
    createCampaign, createQuiz,
    // V1.2 New Campaign CRUD exports
    updateCampaign, deleteCampaign, getCampaignById,
    // V1.2 New Quiz CRUD exports
    updateQuiz, deleteQuiz, getQuizById
} = require('../controllers/adminController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');

router.use(protect);
router.use(authorize(['Admin', 'Authority']));

// Campaign Management Routes (CRUD)
router.post('/campaigns', createCampaign);
router.get('/campaigns/:id', getCampaignById);
router.put('/campaigns/:id', updateCampaign); // Update
router.delete('/campaigns/:id', deleteCampaign); // Delete

// Quiz Management Routes (CRUD)
router.post('/quizzes', createQuiz);
router.get('/quizzes/:id', getQuizById);
router.put('/quizzes/:id', updateQuiz); // Update
router.delete('/quizs/:id', deleteQuiz); // Delete

module.exports = router;