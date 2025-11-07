// src/pages/Profile.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../services/authApi';
import apiClient from '../services/apiClient'; // Import apiClient for the new quiz call
import { Link } from 'react-router-dom';
import { HiOutlineUser, HiOutlineTrophy, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';

// Helper component for stat display (Remains the same)
const StatCard = ({ title, value, icon, colorClass }) => (
  <div className={`glass-card p-4 rounded-xl shadow-lg flex flex-col items-center justify-center text-white ${colorClass}`}>
    <div className="text-3xl mb-1">{icon}</div>
    <p className="text-3xl font-extrabold text-teal-400">{value}</p>
    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mt-1">{title}</p>
  </div>
);


const Profile = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for Quiz Attempt History
  const [quizAttempts, setQuizAttempts] = useState([]); 

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProfileData = async () => {
      try {
        const [profileResponse, attemptsResponse] = await Promise.all([
            getProfile(),
            // Fetch quiz history from the new protected endpoint
            apiClient.get('/quizzes/my-attempts') 
        ]);

        setProfileData(profileResponse);
        setQuizAttempts(attemptsResponse.data); // Data includes score, passed, and title
        
      } catch (err) {
        // Use optional chaining for safer error message access
        const errMsg = err.response?.data?.message || err.message || "Failed to fetch profile data or quiz history.";
        setError(errMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [isAuthenticated]);

  if (!isAuthenticated) return <div className="text-center p-8 text-red-400 bg-gray-900 min-h-screen">Please log in to view your profile.</div>;
  if (loading) return <div className="text-center p-8 bg-gray-900 text-white min-h-screen">Loading profile...</div>;
  if (error) return <div className="text-center p-8 text-red-400 bg-gray-900 min-h-screen">{error}</div>;

  const safeProfile = profileData || user || {};
  const {
    username,
    email,
    role,
    points = 0,
    streak = 0,
    impactScore = 0,
    badges = []
  } = safeProfile;
  
  const quizzesPassedCount = quizAttempts.filter(a => a.passed).length;
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-4xl font-extrabold text-teal-400 mb-2 flex items-center">
            <HiOutlineUser className="mr-3 text-3xl" /> {username}'s Profile
        </h1>
        <p className="text-gray-500 mb-8">View your contributions and civic impact.</p>

        <div className="md:grid md:grid-cols-3 md:space-x-8 gap-6">
          
          {/* LEFT COLUMN: Account Details & Rank */}
          <div className="md:col-span-1 space-y-6">
            
            {/* Account Details Card */}
            <div className="glass-card p-6 rounded-xl shadow-xl">
              <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2 text-teal-400">Account</h2>
              <p className="text-md text-gray-300 font-medium">Email: <span className="font-normal text-white">{email}</span></p>
              <p className="text-md text-gray-300 font-medium mb-4">Role: <span className={`font-bold ${role === 'Admin' ? 'text-red-400' : 'text-indigo-400'}`}>{role}</span></p>
              
              <Link to="/leaderboard" className="mt-4 block text-sm font-bold text-indigo-400 hover:text-indigo-300">
                <HiOutlineTrophy className="inline mr-1"/> View Global Rank
              </Link>
              <button onClick={logout} className="text-sm text-red-500 hover:text-red-400 mt-4 underline">Logout</button>
            </div>

            {/* Quick Stats Card */}
            <div className="glass-card p-6 rounded-xl shadow-xl">
                <h3 className="text-lg font-semibold mb-3 text-gray-300">Quick Stats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                  <StatCard title="Total Points" value={points} icon="⭐" colorClass="bg-yellow-900/40" />
                  <StatCard title="Streak" value={`${streak} days`} icon="🔥" colorClass="bg-red-900/40" />
            </div>

            </div>

          </div>

          {/* RIGHT COLUMN (2/3): Gamification Stats & Badges & Quiz History */}
          <div className="md:col-span-2 space-y-6">
            
            <h2 className="text-2xl font-semibold text-gray-200 mb-4 border-b border-gray-700 pb-2">Impact Metrics</h2>
            
            {/* Gamification Stats Grid (3 columns) */}
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
              <StatCard title="Total Points" value={points} icon="⭐" colorClass="bg-yellow-900/40" />
              <StatCard title="Impact Score" value={impactScore} icon="📊" colorClass="bg-indigo-900/40" />
              {/* Added Quizzes Passed StatCard */}
              <StatCard title="Quizzes Passed" value={quizzesPassedCount} icon="🎓" colorClass="bg-teal-900/40" /> 
            </div>

            {/* Badges Section */}
            <div className="glass-card p-6 rounded-xl shadow-xl">
                <h3 className="text-xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">
                    Badges Earned ({badges.length})
                </h3>
                <div className="flex flex-wrap gap-4">
                    {badges && badges.length > 0 ? (
                        badges.map((badge, index) => (
                            <span 
                                key={index} 
                                className="px-3 py-1 bg-teal-600 text-gray-900 rounded-full text-sm font-bold shadow-md transition transform hover:scale-105"
                            >
                                {badge}
                            </span>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">No badges yet. Start reporting and verifying!</p>
                    )}
                </div>
            </div>
            
            {/* Quiz Attempt History Card */}
            <div className="glass-card p-6 rounded-xl shadow-xl">
                <h3 className="text-xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">
                    Quiz History ({quizAttempts.length} total attempts)
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                    {quizAttempts.length > 0 ? (
                        quizAttempts.map((attempt, index) => (
                            <div 
                                key={index} 
                                className={`p-3 rounded-lg flex justify-between items-center ${attempt.passed ? 'bg-green-900/30' : 'bg-red-900/30'}`}
                            >
                                <div className='flex items-center space-x-2'>
                                    {attempt.passed ? (
                                        <HiOutlineCheckCircle className='text-green-400 text-xl' />
                                    ) : (
                                        <HiOutlineXCircle className='text-red-400 text-xl' />
                                    )}
                                    <div>
                                        {/* Use title from the populated quiz data */}
                                        <p className='font-medium text-white'>{attempt.title || `Quiz Attempt #${index + 1}`}</p>
                                        <p className='text-xs text-gray-400'>Attempted on {new Date(attempt.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    {/* Display Score/Marks */}
                                    <p className='font-bold text-lg'>{attempt.score.toFixed(0)}%</p>
                                    <p className={`text-xs ${attempt.passed ? 'text-green-400' : 'text-red-400'}`}>{attempt.passed ? 'PASSED' : 'FAILED'}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic">No quiz attempts recorded. Time to start learning!</p>
                    )}
                </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;