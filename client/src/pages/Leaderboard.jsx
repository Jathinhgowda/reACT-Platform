// src/pages/Leaderboard.jsx

import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await apiClient.get('/gamification/leaderboard');
        setLeaderboard(response.data);
      } catch (err) {
        setError("Failed to fetch leaderboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="text-center p-8 bg-gray-900 text-white min-h-screen">Loading leaderboard...</div>;
  if (error) return <div className="text-center p-8 text-red-400 bg-gray-900 min-h-screen">{error}</div>;

  const currentUserEntry = leaderboard.find(entry => user?._id === entry._id);
  const currentUserRank = currentUserEntry ? leaderboard.indexOf(currentUserEntry) + 1 : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <h1 className="text-4xl font-extrabold text-teal-400 mb-2 text-center flex items-center justify-center">
          🏆 Civic Leaderboard
        </h1>
        <p className="text-center text-gray-400 mb-8">Top citizens ranked by Impact Score and Points.</p>

        {/* Header Row */}
        <div className="grid grid-cols-12 glass-card p-4 rounded-t-xl text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-700">
          <div className="col-span-1">Rank</div>
          <div className="col-span-6">Citizen Name</div>
          <div className="col-span-3 text-right">Impact Score</div>
          <div className="col-span-2 text-right">Streak</div>
        </div>

        {/* Leaderboard Rows */}
        <div className="space-y-1">
          {leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isCurrentUser = user?._id === entry._id;

            const rankStyle =
              rank === 1 ? 'text-4xl text-yellow-400' :
              rank === 2 ? 'text-3xl text-gray-300' :
              rank === 3 ? 'text-2xl text-amber-700' :
              'text-lg text-gray-500';

            const rankEmoji =
              rank === 1 ? '🥇' :
              rank === 2 ? '🥈' :
              rank === 3 ? '🥉' :
              rank;

            return (
              <div 
                key={entry._id}
                className={`grid grid-cols-12 items-center p-4 transition duration-150 border-b border-gray-800 ${
                  isCurrentUser 
                    ? 'bg-teal-900/50 border-2 border-teal-400 shadow-xl' 
                    : 'hover:bg-gray-800'
                }`}
              >
                {/* Rank */}
                <div className={`col-span-1 font-extrabold ${rankStyle}`}>
                  {rankEmoji}
                </div>

                {/* Username */}
                <div className="col-span-6 flex items-center space-x-3">
                  <span className={`text-lg ${isCurrentUser ? 'text-teal-400 font-bold' : 'text-white'}`}>
                    {entry.username}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs px-2 py-0.5 bg-teal-600 rounded-full font-bold text-gray-900">YOU</span>
                  )}
                </div>

                {/* Impact Score */}
                <div className="col-span-3 text-right">
                  <span className="font-extrabold text-xl text-teal-400">{entry.impactScore}</span>
                  <span className="block text-xs text-gray-500">{entry.points} Points</span>
                </div>

                {/* Streak with 🔥 emoji */}
                <div className="col-span-2 text-right animate-pulse">
                  <span className="text-lg font-bold text-red-400">
                    🔥 {entry.streak}
                  </span>
                  <span className="block text-xs text-gray-500">Day Streak</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current User Rank Summary */}
        {currentUserRank && (
          <div className="mt-8 glass-card p-4 rounded-xl text-center text-sm border-2 border-teal-400">
            Your current global rank is <span className="text-xl font-bold text-teal-400">#{currentUserRank}</span> out of {leaderboard.length} active citizens. Keep up the streak! 💪
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
