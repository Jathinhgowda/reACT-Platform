// src/pages/IssueDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getIssueById, toggleVerification, addComment } from '../services/issueApi';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/ui/StatusBadge';

// NOTE: In a final application, alert() should be replaced with a reusable Toast component.

const IssueDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verification
  const [verificationsCount, setVerificationsCount] = useState(0);
  const [isVerifiedByUser, setIsVerifiedByUser] = useState(false);

  // Comments
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Fetch issue details
  useEffect(() => {
    const fetchIssue = async () => {
      try {
        // Using .lean() on the backend is critical for all nested data to appear here
        const data = await getIssueById(id);
        setIssue(data);
        setVerificationsCount(data.verifications?.length || 0);
        // Use user?._id for safer comparison
        setIsVerifiedByUser(user ? data.verifications?.includes(user._id) : false); 
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id, user]);

  // Handle community verification toggle
  const handleVerificationToggle = async () => {
    if (!isAuthenticated) {
      console.warn('Please log in to verify an issue.');
      return;
    }

    try {
      const result = await toggleVerification(id);
      setIsVerifiedByUser(prev => !prev);
      setVerificationsCount(result.verificationsCount || 0);
      if (issue?.status !== result.newStatus) {
        setIssue(prev => ({ ...prev, status: result.newStatus }));
      }
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      const newComment = await addComment(id, commentText);

      // Update local issue state
      setIssue(prev => ({
        ...prev,
        // Assuming the backend returns the populated user in the newComment object
        comments: [...(prev.comments || []), newComment], 
      }));
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setCommentLoading(false);
    }
  };

  const getProgressPercentage = (status) => {
    switch (status) {
      case 'Pending': return 10;
      case 'Verified': return 35;
      case 'In Progress': return 65;
      case 'Resolved':
      case 'Rejected': return 100;
      default: return 0;
    }
  };

  if (loading) return <div className="text-center p-8 bg-gray-50">Loading issue details...</div>;
  if (error) return <div className="text-center p-8 text-red-600 bg-gray-50">Error: Issue not found or API failed.</div>;
  if (!issue) return <div className="text-center p-8 bg-gray-50">Issue data is unavailable.</div>;

  const progressPercent = getProgressPercentage(issue.status);
  const isVideo = issue.mediaUrl?.includes('.mp4') || issue.mediaUrl?.includes('.mov');
  // Helper for Citizen Role
  const isCitizen = user?.role === 'Citizen';

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-2xl rounded-xl min-h-[80vh]">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{issue.title}</h1>

      <div className="flex flex-wrap items-center space-x-4 mb-6">
        <StatusBadge status={issue.status} />
        <p className="text-sm text-gray-500">
          Category: <span className="font-semibold">{issue.category}</span>
        </p>
        <p className="text-sm text-gray-500">
          Reported by: <span className="font-semibold">{issue.reporter?.username || 'Anonymous'}</span> on {new Date(issue.createdAt).toLocaleDateString()}
        </p>
      </div>
      
      {/* V1.1 Progress Bar */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">Issue Progress</h2>
        <div className="w-full bg-gray-200 rounded-full h-4 relative">
          <div 
            className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          ></div>
          <span className="absolute right-2 top-0 text-xs font-bold text-white leading-4">{progressPercent}%</span>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Verification */}
        <div className="md:col-span-2">
          {issue.mediaUrl && (
            <div className="mb-6 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
              {isVideo ? (
                <video controls src={issue.mediaUrl} className="w-full h-auto max-h-96 object-cover" />
              ) : (
                <img src={issue.mediaUrl} alt={issue.title} className="w-full h-auto max-h-96 object-cover" />
              )}
            </div>
          )}

          <h2 className="text-xl font-semibold mb-3 border-b pb-1">Details</h2>
          <p className="text-gray-700 mb-6">{issue.description}</p>

          {/* Verification Button */}
          {isAuthenticated && isCitizen && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-indigo-700">{verificationsCount}</span>
                      <span className="text-gray-600">Community Verifications</span>
                  </div>
                  <button
                      onClick={handleVerificationToggle}
                      className={`px-4 py-2 rounded-full font-semibold transition duration-200 ${
                          isVerifiedByUser ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'
                      } disabled:opacity-50`}
                  >
                      {isVerifiedByUser ? 'Undo Verification' : 'Verify as Genuine'}
                  </button>
              </div>
          )}

          {/* Comments Section */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Community Discussion ({issue.comments?.length || 0})</h3>

            // src/pages/IssueDetail.jsx (Inside handleCommentSubmit function)

/* Comment Form */
{isAuthenticated && user?.role === 'Citizen' && (
    <form onSubmit={handleCommentSubmit} className="mb-6">
        <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Share your thoughts or update on this issue..."
            rows="3"
            // FIX: Added 'text-gray-900' and 'bg-white' to ensure high contrast
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-indigo-500 text-gray-900 bg-white"
            required
        />
        <button
            type="submit"
            disabled={commentLoading || !commentText.trim()}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
        >
            {commentLoading ? 'Posting...' : 'Post Comment'}
        </button>
    </form>
)}

            {/* Comments List */}
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
              {issue.comments?.map((comment, index) => (
                <div
                  key={comment._id || index}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <p className="text-gray-800">{comment.text}</p>
                  <p className="text-xs text-indigo-500 mt-1 font-medium">
                    {comment.user?.username || 'Anonymous'} - {new Date(comment.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="md:col-span-1 bg-gray-50 p-4 rounded-lg shadow-inner">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700">Progress Timeline</h2>
          <div className="space-y-4">
            {issue.timeline?.map((entry, index) => (
              <div key={index} className="relative pl-6">
                <div className="absolute left-0 top-0 h-full border-l-2 border-indigo-300"></div>
                <div
                  className={`absolute left-[-6px] top-0 w-3 h-3 rounded-full ${
                    index === issue.timeline.length - 1
                      ? 'bg-indigo-600 ring-4 ring-indigo-200'
                      : 'bg-indigo-400'
                  }`}
                ></div>
                <div className="pb-4">
                  <p className="font-semibold text-gray-800">{entry.status}</p>
                  <p className="text-xs text-gray-500">
                    By {entry.user?.username || 'System'} on{' '}
                    {new Date(entry.date).toLocaleDateString()}
                  </p>

                  {/* 🎯 Final Check: Display Resolution Proof if available */}
                  {(entry.resolutionMediaUrl && typeof entry.resolutionMediaUrl === 'string' && entry.resolutionMediaUrl.length > 5) && (
                    <div className="mt-2 p-3 bg-red-100 rounded-md border-2 border-red-500 shadow-md">
                        <p className="text-sm font-bold text-gray-900 mb-1">Resolution Proof:</p>
                        <img
                            src={entry.resolutionMediaUrl}
                            alt="Resolution Proof"
                            className="w-full h-auto max-h-32 object-cover rounded"
                        />
                    </div>
                  )}

                  {/* Comment Rendering Block */}
                  {entry.comment && (
                    <p className="text-sm italic mt-1 text-gray-800">
                      "{entry.comment}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;