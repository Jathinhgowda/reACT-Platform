// src/pages/AdminDashboard.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { getAllIssues, updateIssueStatus } from '../services/issueApi';
import apiClient from '../services/apiClient';
import StatusBadge from '../components/ui/StatusBadge';
import { HiOutlineTrash, HiOutlineRefresh } from 'react-icons/hi'; // Removed HiOutlinePencilAlt

const statusOptions = ['Verified', 'In Progress', 'Resolved', 'Rejected'];


// --- Reusable Toast Component ---
const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'error' 
    ? 'bg-red-900/80 text-red-300 border border-red-700' 
    : 'bg-green-900/80 text-green-300 border border-green-700';

  return (
    <div className={`fixed top-5 right-5 p-4 rounded-xl shadow-2xl backdrop-blur-sm ${bgColor} z-50 animate-slide-in`}>
      {message}
    </div>
  );
};

// Helper function to determine if an issue is overdue
const isOverdue = (issue) => issue.status === 'Pending' && (new Date() - new Date(issue.createdAt)) / (1000 * 60 * 60 * 24) > 7;


const AdminDashboard = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [resolutionMedia, setResolutionMedia] = useState(null);
  const handleMediaChange = (e) => setResolutionMedia(e.target.files[0]);


  const [updateForm, setUpdateForm] = useState({ status: '', comment: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [activeTab, setActiveTab] = useState('issues'); 

  useEffect(() => {
    if (activeTab === 'issues') {
        fetchIssues();
    }
  }, [activeTab]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const data = await getAllIssues();
      const pendingIssues = data.filter(issue => issue.status !== 'Resolved' && issue.status !== 'Rejected');
      
      pendingIssues.sort((a, b) => {
        const overdueA = isOverdue(a);
        const overdueB = isOverdue(b);
        if (overdueA !== overdueB) return overdueA ? -1 : 1; 
        const highA = a.verifications.length >= 5;
        const highB = b.verifications.length >= 5;
        if (highA !== highB) return highA ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setIssues(pendingIssues);
    } catch (err) {
      setError("Failed to fetch issues for dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (e) => setUpdateForm({ ...updateForm, status: e.target.value });
  const handleCommentChange = (e) => setUpdateForm({ ...updateForm, comment: e.target.value });
  
  const handleSelectIssue = (issue) => {
    setSelectedIssueId(issue._id);
    setUpdateForm({ 
      status: issue.status === 'Pending' ? 'Verified' : '', 
      comment: '' 
    });
  };

  const handleUpdate = async (statusOverride) => {
    // 1. Get current values from state
    const statusToUpdate = statusOverride || updateForm.status;
    const commentText = updateForm.comment; // Use the local comment state
    const mediaFile = resolutionMedia; // Use the local media state

    if (!selectedIssueId) return;

    // 2. Client-side validation checks...
    if (!statusToUpdate) {
        setToast({ message: "Please select a status.", type: "error" });
        return;
    }
    
    // Check for comment if Resolved/Rejected
    if (!commentText.trim() && (statusToUpdate === 'Resolved' || statusToUpdate === 'Rejected')) {
        setToast({ message: `A comment is required when setting status to ${statusToUpdate}.`, type: "error" });
        return;
    }

    const isResolution = statusToUpdate === 'Resolved';
    
    if (isResolution && !mediaFile) {
        setToast({ message: "A resolution photo/media is required to mark as Resolved.", type: "error" });
        return;
    }

    setIsUpdating(true);
    
    try {
      const formData = new FormData();
      let endpoint = `/issues/${selectedIssueId}/status`; // Default JSON endpoint

      // 3. Append required fields with their FINAL backend names
      formData.append('status', statusToUpdate);
      formData.append('comment', commentText);

      if (isResolution && mediaFile) {
        // NOTE: The server's upload.js uses 'resolutionMedia'
        formData.append('resolutionMedia', mediaFile); 
        endpoint = `/issues/${selectedIssueId}/resolution-status`; 
      }
      
      // 4. API Call
      await apiClient.put(endpoint, formData, {
          // Set Content-Type to undefined when sending FormData
          headers: (isResolution && mediaFile) ? { 'Content-Type': undefined } : {}
      });

      setToast({ message: `Issue status updated to ${statusToUpdate}.`, type: 'success' });
      
      // Reset states
      setSelectedIssueId(null);
      setUpdateForm({ status: '', comment: '' });
      setResolutionMedia(null); // Clear media state
      fetchIssues(); 
      
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Update failed.';
      setToast({ message: `Update failed: ${errMsg}`, type: 'error' });
    } finally {
      setIsUpdating(false);
    }
  };

  const selectedIssue = useMemo(() => issues.find(issue => issue._id === selectedIssueId), [issues, selectedIssueId]);
  
  if (loading && activeTab === 'issues') return <div className="text-center p-8 bg-gray-900 text-white min-h-screen">Loading Authority Dashboard...</div>;
  if (error && activeTab === 'issues') return <div className="text-center p-8 text-red-400 bg-gray-900 min-h-screen">{error}</div>;

  const tabClass = (tabName) => 
    `px-6 py-2 rounded-t-lg font-bold transition duration-200 ${
      activeTab === tabName 
        ? 'bg-gray-800 text-teal-400 border-b-2 border-teal-400' 
        : 'bg-gray-700/50 text-gray-400 hover:text-white'
    }`;
  
  return (
    <div className="min-h-screen w-full bg-gray-900 text-white px-2 sm:px-4 lg:px-8 py-8">
      
      <h1 className="text-3xl font-bold text-teal-400 mb-6">Admin & Content Control Panel</h1>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-6 overflow-x-auto">
        <button className={tabClass('issues')} onClick={() => setActiveTab('issues')}>
          Issue Review
        </button>
        <button className={tabClass('campaigns')} onClick={() => setActiveTab('campaigns')}>
          Create Campaign
        </button>
        <button className={tabClass('quizzes')} onClick={() => setActiveTab('quizzes')}>
          Create Quiz
        </button>
        {/* Manage Content Tab */}
        <button className={tabClass('manage')} onClick={() => setActiveTab('manage')}>
          Manage Content
        </button>
      </div>

      {/* RENDER ACTIVE TAB CONTENT */}
      {activeTab === 'issues' && (
        <IssueReviewContent 
          issues={issues} selectedIssueId={selectedIssueId} handleSelectIssue={handleSelectIssue} 
          selectedIssue={selectedIssue} updateForm={updateForm} handleStatusChange={handleStatusChange} 
          handleCommentChange={handleCommentChange} handleUpdate={handleUpdate} isUpdating={isUpdating} 
          isOverdue={isOverdue} handleMediaChange={handleMediaChange}
        />
      )}
      
      {activeTab === 'campaigns' && <CampaignCreationForm setToast={setToast} setActiveTab={setActiveTab}/>}
      {activeTab === 'quizzes' && <QuizCreationForm setToast={setToast} setActiveTab={setActiveTab} />}
      
      {activeTab === 'manage' && <ContentManagementContent setToast={setToast} />}

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminDashboard;

// --- 3. SUB-COMPONENTS (Simplified/Placeholder) ---

// --- 3.1 Issue Review Content (Restored Component) ---
const IssueReviewContent = ({ issues, selectedIssueId, handleSelectIssue, selectedIssue, updateForm, handleStatusChange, handleCommentChange, handleUpdate, isUpdating, isOverdue,handleMediaChange }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Issue List */}
        <div className="lg:col-span-2 glass-card p-4 shadow-xl rounded-xl">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-gray-200">
                Issues Awaiting Action ({issues.length})
            </h2>
            <div className="space-y-3 max-h-[80vh] overflow-y-auto pr-2">
                {issues.length > 0 ? (
                    issues.map(issue => {
                        const overdue = isOverdue(issue);
                        const highVerifications = issue.verifications.length >= 5;
                        
                        return (
                            <div
                                key={issue._id}
                                className={`p-3 border rounded-lg cursor-pointer transition duration-150 flex justify-between items-center ${
                                    selectedIssueId === issue._id
                                    ? 'bg-white/10 border-teal-400 shadow-lg'
                                    : `bg-gray-800 hover:bg-gray-700 border-gray-700 ${overdue ? 'border-red-600 shadow-red-500/20' : ''}`
                                }`}
                                onClick={() => handleSelectIssue(issue)}
                            >
                                <div>
                                    <p className={`font-bold text-white ${overdue ? 'text-red-400' : ''}`}>
                                        {issue.title}
                                        {highVerifications && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-900 text-yellow-300 rounded-full border border-yellow-700">Priority Review</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Reported: {new Date(issue.createdAt).toLocaleDateString()} | Cat: {issue.category}
                                    </p>
                                </div>
                                <StatusBadge status={issue.status} />
                            </div>
                        );
                    })
                ) : (
                    <p className="text-gray-400 p-4">All clear! No pending issues for review.</p>
                )}
            </div>
        </div>

        {/* Action Panel */}
        <div className="lg:col-span-1 sticky top-20">
            <div className="glass-card p-6 shadow-xl rounded-xl">
                <h2 className="text-xl font-semibold mb-4 text-teal-400">Action Panel</h2>

                {selectedIssueId && selectedIssue ? (
                    <>
                        {/* Issue Preview */}
                        <div className="mb-4 pb-4 border-b border-gray-700">
                            <h3 className="text-lg font-bold text-white">{selectedIssue.title}</h3>
                            <StatusBadge status={selectedIssue.status} />

                            {selectedIssue.mediaUrl ? (
                                <div className="my-3 max-h-40 overflow-hidden rounded-md shadow">
                                    {selectedIssue.mediaUrl.includes('.mp4') || selectedIssue.mediaUrl.includes('.mov') ? (
                                        <video controls src={selectedIssue.mediaUrl} className="w-full h-auto object-cover" />
                                    ) : (
                                        <img src={selectedIssue.mediaUrl} alt="Issue media" className="w-full h-auto object-cover" />
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 italic mt-2">No media uploaded</p>
                            )}

                            <p className="text-sm italic text-gray-400 mt-2 line-clamp-3">{selectedIssue.description}</p>
                            <p className="text-xs text-gray-500 mt-1">Verifications: {selectedIssue.verifications.length}</p>
                        </div>

                        {/* Status Update Form */}
                        <form onSubmit={e => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-400">Update Status To:</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={updateForm.status}
                                    onChange={handleStatusChange}
                                    required
                                    className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white"
                                >
                                    <option value="" className='bg-gray-800'>-- Select New Status --</option>
                                    {statusOptions.map(s => <option key={s} value={s} className='bg-gray-800'>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="comment" className="block text-sm font-medium text-gray-400">Authority Comment</label>
                                <textarea
                                    id="comment"
                                    name="comment"
                                    rows="3"
                                    value={updateForm.comment}
                                    onChange={handleCommentChange}
                                    className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white"
                                />
                            </div>



                            <div className="flex space-x-2">
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-900 bg-teal-400 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition"
                                >
                                    {isUpdating ? 'Updating...' : 'Confirm Status Update'}
                                </button>

                                {/* Quick Verify Button */}
                                {(selectedIssue.status === 'Pending' || selectedIssue.status === 'Verified') && (
                                    <button
                                        type="button"
                                        onClick={() => handleUpdate('Verified')}
                                        disabled={isUpdating || selectedIssue.status === 'Verified'}
                                        className="flex-1 py-2 px-4 border border-blue-600 rounded-lg shadow-sm text-sm font-bold text-blue-400 bg-transparent hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                                    >
                                        {selectedIssue.status === 'Verified' ? 'ALREADY VERIFIED' : 'Quick Verify'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </>
                ) : (
                    <p className="text-gray-500 italic">Select an issue from the list to review and update its status.</p>
                )}
            </div>
        </div>
    </div>
);

// --- 3.2 Campaign Creation Form ---
const campaignTargetActions = ['Report', 'Verify', 'Comment'];

const CampaignCreationForm = ({ setToast, setActiveTab }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        targetAction: campaignTargetActions[0],
        targetGoal: 1,
        rewardPoints: 50,
        rewardBadge: 'Campaign Contributor',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); // START SUBMISSION

        try {
            // Await the API call
            const response = await apiClient.post('/admin/campaigns', formData);
            
            // --- SUCCESS PATH ---
            
            // 1. Show Success Toast using the message from the server response
            setToast({ message: response.data.message, type: 'success' });
            
            // 2. Reset form to initial state
            setFormData({
                title: '', description: '', startDate: '', endDate: '',
                targetAction: campaignTargetActions[0], targetGoal: 1, rewardPoints: 50, rewardBadge: 'Campaign Contributor',
            });
            
            // 3. Navigate to manage tab after a short delay (for the toast to appear)
            setTimeout(() => {
                setActiveTab('manage'); // Use 'manage' since the tab is labeled 'Manage Content'
            }, 500); 

        } catch (err) {
            // --- ERROR PATH ---
            console.error("Campaign Creation Failed Payload:", err.response);
            const msg = err.response?.data?.message || 'Campaign creation failed. Check server logs.';
            setToast({ message: msg, type: 'error' });
            
        } finally {
            // --- GUARANTEED RESET ---
            // This ensures the button unsticks in ALL scenarios (success or failure).
            setIsSubmitting(false); 
        }
    };

    return (
        <div className="max-w-3xl mx-auto glass-card p-6 shadow-xl rounded-xl">
            <h3 className="text-2xl font-bold text-gray-200 mb-6 border-b border-gray-700 pb-2">🚀 Create New Civic Campaign</h3>
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Title and Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-400">Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} required rows="3" className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white" />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Start Date</label>
                        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">End Date</label>
                        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white" />
                    </div>
                </div>

                {/* Goal Definition */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Target Action</label>
                        <select name="targetAction" value={formData.targetAction} onChange={handleChange} className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white">
                            {campaignTargetActions.map(action => <option key={action} value={action} className='bg-gray-800'>{action}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Target Goal (Count)</label>
                        <input type="number" name="targetGoal" value={formData.targetGoal} onChange={handleChange} required min="1" className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Reward Points</label>
                        <input type="number" name="rewardPoints" value={formData.rewardPoints} onChange={handleChange} required min="1" className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white" />
                    </div>
                </div>

                {/* Reward Badge */}
                <div>
                    <label className="block text-sm font-medium text-gray-400">Reward Badge Name</label>
                    <input type="text" name="rewardBadge" value={formData.rewardBadge} onChange={handleChange} required className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white" />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 px-4 rounded-lg shadow-lg text-sm font-bold text-gray-900 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 transition"
                >
                    {isSubmitting ? 'Creating...' : 'Launch Campaign'}
                </button>
            </form>
        </div>
    );
};

// --- 3.3 Quiz Creation Form ---
const QuizCreationForm = ({ setToast, setActiveTab }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        pointsAwarded: 20,
        questions: [{ text: '', options: ['', '', '', ''], correctAnswerIndex: 0 }],
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleQuizChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[index][field] = value;
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuestions = [...formData.questions];
        newQuestions[qIndex].options[oIndex] = value;
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    const addQuestion = () => {
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, { text: '', options: ['', '', '', ''], correctAnswerIndex: 0 }]
        }));
    };

    const removeQuestion = (index) => {
        const newQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Basic check to ensure all options are non-empty
            if (formData.questions.some(q => q.options.some(o => o.trim() === ''))) {
                setToast({ message: 'All options for all questions must be filled.', type: 'error' });
                setIsSubmitting(false);
                return;
            }

            // Note: Using apiClient.post as per original prompt structure
            const response = await apiClient.post('/admin/quizzes', formData);
            setToast({ message: response.data.message, type: 'success' });
            // Reset form (simplified for brevity)
            setFormData({
                title: '', description: '', pointsAwarded: 20,
                questions: [{ text: '', options: ['', '', '', ''], correctAnswerIndex: 0 }],
            });
            // Switch to manage tab after successful creation
            setActiveTab('quizzes');
            return;
        } catch (err) {
            const msg = err.response?.data?.message || 'Quiz creation failed.';
            setToast({ message: msg, type: 'error' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto glass-card p-6 shadow-xl rounded-xl">
            <h3 className="text-2xl font-bold text-gray-200 mb-6 border-b border-gray-700 pb-2">🧠 Create New Civic Quiz</h3>
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Quiz Metadata */}
                <div className="grid grid-cols-3 gap-4">
                    <div className='col-span-2'>
                        <label className="block text-sm font-medium text-gray-400">Quiz Title</label>
                        <input type="text" name="title" value={formData.title} onChange={handleQuizChange} required className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Points Awarded</label>
                        <input type="number" name="pointsAwarded" value={formData.pointsAwarded} onChange={handleQuizChange} required min="1" className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleQuizChange} required rows="2" className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-800 text-white" />
                </div>

                {/* Questions Section */}
                <h4 className="text-xl font-semibold text-teal-400 pt-4 border-t border-gray-700">Questions</h4>

                <div className='space-y-6'>
                    {formData.questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                            <div className='flex justify-between items-center mb-3'>
                                <label className="text-sm font-medium text-gray-400">Question {qIndex + 1} Text:</label>
                                {formData.questions.length > 1 && (
                                    <button type="button" onClick={() => removeQuestion(qIndex)} className='text-red-400 text-sm hover:text-red-300'>Remove</button>
                                )}
                            </div>

                            <input type="text" value={q.text} onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)} required className="mb-3 block w-full border border-gray-700 rounded-lg shadow-sm p-2 bg-gray-900 text-white" />

                            <label className="block text-sm font-medium text-gray-400 mb-2">Options (Select Correct Answer):</label>
                            <div className='space-y-2'>
                                {q.options.map((option, oIndex) => (
                                    <div key={oIndex} className='flex items-center'>
                                        <input
                                            type="radio"
                                            name={`correct-${qIndex}`}
                                            checked={q.correctAnswerIndex === oIndex}
                                            onChange={() => handleQuestionChange(qIndex, 'correctAnswerIndex', oIndex)}
                                            required
                                            className='form-radio text-teal-400 bg-gray-700 border-gray-600 focus:ring-teal-500'
                                        />
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                            required
                                            className={`flex-grow ml-3 p-2 border rounded-lg bg-gray-900 text-white ${q.correctAnswerIndex === oIndex ? 'border-teal-400' : 'border-gray-700'}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={addQuestion}
                    className='py-2 px-4 rounded-lg text-sm font-bold text-indigo-400 bg-indigo-900/50 hover:bg-indigo-900/80 transition'
                >
                    + Add New Question
                </button>


                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 px-4 rounded-lg shadow-lg text-lg font-bold text-gray-900 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 transition"
                >
                    {isSubmitting ? 'Creating Quiz...' : 'Finalize & Publish Quiz'}
                </button>
            </form>
        </div>
    );
};



// --- 3.4 Content Management Content (DELETE FUNCTIONALITY ONLY) ---
const ContentManagementContent = ({ setToast }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loadingContent, setLoadingContent] = useState(true);

    const fetchContent = async () => {
        setLoadingContent(true);
        try {
            // Fetch all content (assuming admin has access to all)
            const [campaignsRes, quizzesRes] = await Promise.all([
                apiClient.get('/campaigns'),
                apiClient.get('/quizzes')
            ]);
            setCampaigns(campaignsRes.data);
            setQuizzes(quizzesRes.data);
            
        } catch (error) {
            setToast({ message: "Failed to fetch content for management.", type: 'error' });
        } finally {
            setLoadingContent(false);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const handleDelete = async (type, id, title) => {
        // Use window.confirm for blocking confirmation, then use Toast for result
        if (!window.confirm(`WARNING: Are you sure you want to permanently delete the ${type}: "${title}"?`)) {
             setToast({ message: "Deletion cancelled.", type: 'error' });
             return;
        }   

        const endpointType = (type === 'quiz') ? 'quizzes' : `${type}s`;

        try {
            // Hit the DELETE endpoint
            await apiClient.delete(`/admin/${type}s/${id}`);
            setToast({ message: `${type} "${title}" deleted successfully.`, type: 'success' });
            fetchContent(); // Refresh list
        } catch (error) {
            const errMsg = error.response?.data?.message || `Failed to delete ${type}.`;
            setToast({ message: errMsg, type: 'error' });
        }
    };

    if (loadingContent) return <div className="text-center p-8 text-gray-400">Loading content...</div>;

    return (
        <div className="space-y-6">
            <button onClick={fetchContent} className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center">
                <HiOutlineRefresh className="mr-2" /> Refresh Content List
            </button>
            
            {/* Campaigns Management */}
            <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-bold text-teal-400 mb-4">Manage Campaigns ({campaigns.length})</h3>
                {campaigns.map(c => (
                    <div key={c._id} className="flex justify-between items-center p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-800/50">
                        <div className="text-sm">
                            <p className="font-semibold">{c.title}</p>
                            <p className="text-xs text-gray-400">Ends: {new Date(c.endDate).toLocaleDateString()} | Goal: {c.targetGoal} {c.targetAction}s</p>
                        </div>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => handleDelete('campaign', c._id, c.title)}
                                className="text-red-400 hover:text-red-300 p-1"
                            >
                                <HiOutlineTrash className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quizzes Management */}
            <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-bold text-teal-400 mb-4">Manage Quizzes ({quizzes.length})</h3>
                {quizzes.map(q => (
                    <div key={q._id} className="flex justify-between items-center p-3 border-b border-gray-700 last:border-b-0 hover:bg-gray-800/50">
                        <div className="text-sm">
                            <p className="font-semibold">{q.title}</p>
                            <p className="text-xs text-gray-400">Questions: {q.questions.length} | Reward: {q.pointsAwarded} Pts</p>
                        </div>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => handleDelete('quiz', q._id, q.title)}
                                className="text-red-400 hover:text-red-300 p-1"
                            >
                                <HiOutlineTrash className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};