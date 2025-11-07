// server/routes/quizRoutes.js

const express = require('express');
const router = express.Router();
const { 
  getQuizzes, 
  submitQuiz, 
  getMyQuizAttempts
} = require('../controllers/quizController');
const protect = require('../middleware/auth');

router.get('/', protect, getQuizzes);
router.post('/:id/submit', protect, submitQuiz);

// The line causing the error (if getMyQuizAttempts wasn't imported):
router.get('/my-attempts', protect, getMyQuizAttempts); 

module.exports = router;