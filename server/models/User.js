const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }, // Don't return password by default
  role: { type: String, enum: ['Citizen', 'Authority', 'Admin'], default: 'Citizen' },
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  impactScore: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  subscription: {
  type: Object,
  default: null
}

}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);