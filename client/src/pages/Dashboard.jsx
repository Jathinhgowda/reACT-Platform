// src/pages/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import IssueMap from '../components/map/IssueMap';
import StatusBadge from '../components/ui/StatusBadge';
import { getAllIssues } from '../services/issueApi';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { HiDocumentText, HiCheckCircle, HiUserGroup, HiOutlineMagnifyingGlass } from 'react-icons/hi2';
import { subscribeUserToPush } from '../utils/notifications';

const VAPID_PUBLIC_KEY = "BIVwraTBwaLDQ5En00J7nVH7isfIrKv_Ha9ZrDkzZE1_pnA7PdeML6-_FCr8g_hiWjh0Cso6Nv9NsKUSTlMtVEo";

const Dashboard = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({});
  const [filter, setFilter] = useState({ category: 'All', status: 'All' });
  const [searchTerm, setSearchTerm] = useState('');

  const issueCategories = ['All', 'Roads', 'Water', 'Electricity', 'Waste', 'Other'];
  const issueStatuses = ['All', 'Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [issueData, summaryResponse] = await Promise.all([
          getAllIssues(),
          (user && (user.role === 'Authority' || user.role === 'Admin'))
            ? apiClient.get('/analytics/summary')
            : Promise.resolve({ data: {} }),
        ]);

        setIssues(issueData);
        if (summaryResponse.data) setSummary(summaryResponse.data);
      } catch (err) {
        setError(err?.message || 'An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // ✅ Notification prompt logic
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission !== 'granted') {
      const timer = setTimeout(() => {
        if (window.confirm('Do you want to enable push notifications for report updates?')) {
          subscribeUserToPush(VAPID_PUBLIC_KEY);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const filteredIssues = issues.filter((issue) => {
    const issueCategory = issue.category?.trim().toLowerCase() || '';
    const filterCategory = filter.category?.trim().toLowerCase() || '';
    const titleMatch = issue.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = issue.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = filterCategory === 'all' || issueCategory === filterCategory;
    const statusMatch = filter.status === 'All' || issue.status === filter.status;
    const searchMatch = titleMatch || descMatch;
    return categoryMatch && statusMatch && searchMatch;
  });

  const resolvedIssues = issues.filter(i => i.status === 'Resolved');
  const peopleImpactedCount = resolvedIssues.reduce((sum, issue) => {
    const impactMap = { Roads: 100, Water: 50, Electricity: 75, Waste: 40, Other: 30 };
    return sum + (impactMap[issue.category] || 20);
  }, 0);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white animate-pulse">🚀 Loading your dashboard...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">❌ Error: {error}</div>;

  const getStatusDotColor = (status) => {
    switch(status){
      case 'Pending': return 'bg-red-500';
      case 'Verified':
      case 'In Progress': return 'bg-yellow-500';
      case 'Resolved': return 'bg-green-500';
      case 'Rejected': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white px-3 sm:px-6 py-6">
      {/* HEADER & SEARCH */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-teal-400 tracking-tight">
           Dashboard
        </h1>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder=" Search issues..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-gray-800/70 text-gray-200 border border-gray-700 
                       focus:border-teal-400 focus:ring-0 outline-none transition-all duration-300"
          />
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* MAP SECTION */}
        <div className="lg:col-span-2 bg-gray-800/40 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-xl p-4 transition hover:shadow-teal-500/20 h-[500px]">
          <IssueMap issues={filteredIssues} isDarkMode={true} />
        </div>

        {/* REPORTS SECTION */}
        <div className="bg-gray-800/40 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-xl p-6 flex flex-col h-[500px] transition hover:shadow-teal-500/20">
          <h2 className="text-xl font-semibold mb-4 text-teal-300"> Reports Overview</h2>

          {/* FILTERS */}
<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 border-b border-gray-700 pb-2 gap-2">
  <span className="text-gray-400 font-medium w-full sm:w-2/3">Filters</span>
  <div className="flex space-x-3 w-full sm:w-auto">
    
    {/* STATUS DROPDOWN */}
    <select
      value={filter.status}
      onChange={e => setFilter({ ...filter, status: e.target.value })}
      className="w-full sm:w-36 bg-gray-900 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 
                 cursor-pointer hover:border-teal-400 focus:border-teal-400 focus:ring-0 
                 transition-all duration-300"
    >
      {issueStatuses.map(s => (
        <option
          key={s}
          value={s}
          className="bg-gray-900 text-gray-200"
        >
          {s}
        </option>
      ))}
    </select>

    {/* CATEGORY DROPDOWN */}
    <select
      value={filter.category}
      onChange={e => setFilter({ ...filter, category: e.target.value })}
      className="w-full sm:w-36 bg-gray-900 text-gray-200 border border-gray-700 rounded-lg px-3 py-2 
                 cursor-pointer hover:border-teal-400 focus:border-teal-400 focus:ring-0 
                 transition-all duration-300"
    >
      {issueCategories.map(c => (
        <option
          key={c}
          value={c}
          className="bg-gray-900 text-gray-200"
        >
          {c}
        </option>
      ))}
    </select>

  </div>
</div>


          {/* ISSUE LIST */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-2">
            {filteredIssues.slice(0,5).map(issue => (
              <Link key={issue._id} to={`/issues/${issue._id}`} className="block p-3 rounded-lg hover:bg-gray-700/30 transition border-b border-gray-800">
                <div className="flex justify-between items-start text-sm">
                  <div className="font-semibold text-white w-2/3">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusDotColor(issue.status)}`}></span>
                    {issue.title}
                    <div className="text-xs text-gray-500 mt-1 pl-4 font-normal">
                      {issue.category} | {issue.location?.coordinates ? `[${issue.location.coordinates[1].toFixed(2)}, ...]` : "No Location"}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 flex flex-col items-end pt-1">
                    <span className={`font-medium ${issue.status==='Resolved'?'text-green-400':'text-yellow-400'}`}>{issue.status}</span>
                    <span className="mt-1">{new Date(issue.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
            {filteredIssues.length===0 && <p className="text-gray-400 p-4 text-center"> No reports match your filters.</p>}
          </div>

          <Link to="/reports" className="mt-4 block w-full text-center py-2 text-teal-400 border border-teal-400 rounded-lg font-semibold hover:bg-teal-400 hover:text-gray-900 transition">
            View All Reports →
          </Link>
        </div>
      </div>

      {/* METRICS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <AnimatedCounter
          endValue={summary.total || issues.length}
          title=" Total Reports"
          icon={<HiDocumentText className="text-teal-400 text-5xl mb-2" />}
          colorClass="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-teal-500/20 transition"
        />
        <AnimatedCounter
          endValue={summary.resolved || resolvedIssues.length}
          title="Resolved Issues"
          icon={<HiCheckCircle className="text-teal-400 text-5xl mb-2" />}
          colorClass="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-teal-500/20 transition"
        />
        <AnimatedCounter
          endValue={peopleImpactedCount}
          title=" People Impacted"
          icon={<HiUserGroup className="text-teal-400 text-5xl mb-2" />}
          colorClass="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 shadow-xl hover:shadow-teal-500/20 transition"
          suffix="+"
        />
      </div>
    </div>
  );
};

export default Dashboard;
