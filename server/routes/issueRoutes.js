const express = require('express');
const router = express.Router();
const {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  updateResolutionStatus,  // ✅ new controller import
  toggleVerification,
  addComment,
} = require('../controllers/issueController');

const protect = require('../middleware/auth');
const processUpload = require('../middleware/upload');
const authorize = require('../middleware/roleCheck');
const Issue = require('../models/Issue');

// 🧩 Citizen-facing routes
router.post('/', protect, processUpload, createIssue); // Create new issue (with file upload)
router.get('/', getIssues); // Public: Get all issues
router.get('/:id', getIssueById); // Public: Get issue by ID
router.post('/:id/verify', protect, toggleVerification); // Community verification
router.post('/:id/comments', protect, addComment); // Add comment to an issue

// 🧩 Authority/Admin routes
router.put(
  '/:id/status',
  protect,
  authorize(['Authority', 'Admin']),
  updateIssueStatus
);

// ✅ New route for resolution media upload + status update
router.put(
  '/:id/resolution-status',
  protect,
  authorize(['Authority', 'Admin']),
  processUpload,
  updateResolutionStatus
);

module.exports = router;
