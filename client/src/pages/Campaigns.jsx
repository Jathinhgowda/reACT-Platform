// src/pages/Campaigns.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { HiOutlineCalendar, HiOutlineTrophy, HiOutlineUser } from 'react-icons/hi2';

// --- Reusable Toast Component ---
// NOTE: This must be defined or imported from its location (e.g., ../components/ui/Toast)
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

const Campaigns = () => {
  const { isAuthenticated } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); 

  const fetchCampaigns = async () => {
    try {
      // API call sends JWT if authenticated, allowing the backend to return user status
      const response = await apiClient.get('/campaigns');
      setCampaigns(response.data);
    } catch (err) {
      setError("Failed to fetch active campaigns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [isAuthenticated]); 

  const calculateProgress = (campaign) => {
    const daysLeft = Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    // User progress comes directly from the backend response
    const progress = (campaign.userProgress || 0); 
    const percent = Math.min((progress / campaign.targetGoal) * 100, 100);
    
    return { percent: percent, days: daysLeft, progress: progress };
  };

  const handleJoinCampaign = async (campaignId, campaignTitle) => {
    if (!isAuthenticated) {
        setToast({ message: "You must be logged in to join a campaign.", type: 'error' });
        return;
    }
    
    try {
        // ACTUAL API CALL to join the campaign
        await apiClient.post(`/campaigns/${campaignId}/join`);
        
        // Optimistically update the UI after successful API response
        setCampaigns(prev => prev.map(c => 
            c._id === campaignId ? { ...c, isJoined: true, userProgress: 0 } : c
        ));
        
        setToast({ message: `Successfully joined ${campaignTitle}! Your progress is now being tracked.`, type: 'success' });
        
    } catch (err) {
        const msg = err.response?.data?.message || "Failed to join campaign. Please try again.";
        setToast({ message: msg, type: 'error' });
    }
  };


  if (loading) return <div className="text-center p-8 bg-gray-900 text-white min-h-screen">Loading campaigns...</div>;
  if (error) return <div className="text-center p-8 text-red-400 bg-gray-900 min-h-screen">{error}</div>;


  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <h1 className="text-4xl font-extrabold text-teal-400 mb-2">Active Campaigns</h1>
      <p className="text-gray-400 mb-8">Participate in monthly challenges to earn points and badges.</p>

      {campaigns.length === 0 ? (
        <div className="glass-card p-10 rounded-xl text-center text-gray-400">
          No active campaigns right now. Check back soon!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const { percent, days, progress } = calculateProgress(campaign);
            const isJoined = campaign.isJoined; 
            const isComplete = percent >= 100;
            
            return (
              <div key={campaign._id} className="glass-card p-6 rounded-xl shadow-2xl flex flex-col justify-between hover:bg-white/5 transition duration-200">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{campaign.title}</h2>
                  <p className="text-sm text-gray-400 mb-4">{campaign.description}</p>
                  
                  {/* Goal and Reward */}
                  <div className="flex items-center space-x-4 text-sm font-medium mb-4 border-t border-gray-700 pt-3">
                    <span className="text-yellow-400 flex items-center">
                      <HiOutlineTrophy className="mr-1" /> {campaign.rewardPoints} Pts + {campaign.rewardBadge}
                    </span>
                    <span className="text-indigo-400 flex items-center">
                      <HiOutlineCalendar className="mr-1" /> {days > 0 ? `${days} Days Left` : 'Ended'}
                    </span>
                  </div>
                  
                  {/* User Progress Bar */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-1">
                        Your Progress: {progress}/{campaign.targetGoal} {campaign.targetAction}s
                    </p>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all duration-700 ${isComplete ? 'bg-green-500' : 'bg-teal-400'}`} 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <p className={`text-xs mt-1 ${isComplete ? 'text-green-400 font-bold' : 'text-gray-500'}`}>
                        {isComplete ? 'Goal Achieved!' : `${percent.toFixed(0)}% Complete`}
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                {isJoined ? (
                    <button
                        disabled={true}
                        className="mt-4 w-full py-2 px-4 rounded-lg font-bold text-sm text-gray-900 bg-green-500/70 cursor-default flex items-center justify-center"
                    >
                        <HiOutlineUser className="mr-1 text-lg" /> Joined & Tracking
                    </button>
                ) : (
                    <button
                        onClick={() => handleJoinCampaign(campaign._id, campaign.title)}
                        disabled={!isAuthenticated || days <= 0}
                        className="mt-4 w-full py-2 px-4 rounded-lg font-bold text-gray-900 bg-teal-400 hover:bg-teal-300 transition disabled:opacity-50"
                    >
                        {days <= 0 ? 'Campaign Ended' : 'Participate Now'}
                    </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Campaigns;