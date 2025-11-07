// server/models/UserQuizAttempt.js (This is the correct content for this file)

const mongoose = require('mongoose');

const userQuizAttemptSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  quizId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  passed: {
    type: Boolean, 
    default: false 
  },
  score: {
    type: Number, 
    required: true 
  },
}, {
  timestamps: true
});

// CORRECT: Apply the unique constraint to prevent double-passing the same quiz
userQuizAttemptSchema.index({ userId: 1, quizId: 1 }, { unique: true });

module.exports = mongoose.model('UserQuizAttempt', userQuizAttemptSchema);