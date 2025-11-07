// server/models/Quiz.js (Restore the Quiz schema content here)

const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  pointsAwarded: { type: Number, default: 20 },
  questions: [{
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswerIndex: { type: Number, required: true }, // Index of the correct option
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);