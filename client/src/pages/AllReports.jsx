import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllIssues } from '../services/issueApi';
import StatusBadge from '../components/ui/StatusBadge';
import { HiOutlineSortAscending, HiOutlineSortDescending } from 'react-icons/hi';

const issueCategories = ['All', 'Roads', 'Water', 'Electricity', 'Waste', 'Other'];
const issueStatuses = ['All', 'Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'];

const AllReports = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({ category: 'All', status: 'All' });
  const [sort, setSort] = useState({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const data = await getAllIssues();
        setIssues(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch all issues.');
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  // Filtering
  const filteredIssues = issues.filter((issue) => {
    const categoryMatch = filter.category === 'All' || issue.category === filter.category;
    const statusMatch = filter.status === 'All' || issue.status === filter.status;
    return categoryMatch && statusMatch;
  });

  // Sorting
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    const aValue = a[sort.key] || '';
    const bValue = b[sort.key] || '';
    let comparison = 0;
    if (aValue > bValue) comparison = 1;
    if (aValue < bValue) comparison = -1;
    return sort.direction === 'asc' ? comparison : comparison * -1;
  });

  const handleSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const SortIcon = ({ keyName }) => {
    if (sort.key !== keyName) return null;
    return sort.direction === 'desc' ? (
      <HiOutlineSortDescending className="ml-1 text-teal-400" />
    ) : (
      <HiOutlineSortAscending className="ml-1 text-teal-400" />
    );
  };

  if (loading) return <div className="text-center p-8 bg-gray-900 text-white min-h-screen">Loading all reports...</div>;
  if (error) return <div className="text-center p-8 text-red-400 bg-gray-900 min-h-screen">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-teal-400 mb-6">
        All Civic Reports ({issues.length})
      </h1>

      {/* Filter Controls */}
      <div className="glass-card p-4 rounded-xl shadow-2xl mb-6 flex flex-wrap gap-4 items-center">
        <div className="text-gray-400 text-sm">Filter:</div>

        <div>
          <label className="text-sm font-medium text-gray-400">Category:</label>
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="glass-input ml-2 p-1 border rounded bg-gray-800 text-white"
          >
            {issueCategories.map((cat) => (
              <option key={cat} value={cat} className="bg-gray-800">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-400">Status:</label>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="glass-input ml-2 p-1 border rounded bg-gray-800 text-white"
          >
            {issueStatuses.map((s) => (
              <option key={s} value={s} className="bg-gray-800">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-500 ml-auto">
          Displaying {sortedIssues.length} matching reports.
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card p-6 rounded-xl shadow-2xl overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-left text-base uppercase">
              <th className="py-4 px-4">Media</th>
              <th
                className="py-4 px-4 cursor-pointer hover:text-teal-400 transition flex items-center"
                onClick={() => handleSort('title')}
              >
                <span>Issue Title</span>
                <SortIcon keyName="title" />
              </th>
              <th
                className="py-4 px-4 cursor-pointer hover:text-teal-400 transition"
                onClick={() => handleSort('category')}
              >
                <span>Category</span>
                <SortIcon keyName="category" />
              </th>
              <th
                className="py-4 px-4 cursor-pointer hover:text-teal-400 transition"
                onClick={() => handleSort('status')}
              >
                <span>Status</span>
                <SortIcon keyName="status" />
              </th>
              <th
                className="py-4 px-4 cursor-pointer hover:text-teal-400 transition"
                onClick={() => handleSort('verifications')}
              >
                <span>Verified</span>
              </th>
              <th
                className="py-4 px-4 cursor-pointer hover:text-teal-400 transition"
                onClick={() => handleSort('createdAt')}
              >
                <span>Reported On</span>
                <SortIcon keyName="createdAt" />
              </th>
              <th className="py-4 px-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {sortedIssues.map((issue) => (
              <tr
                key={issue._id}
                className="border-b border-gray-800 hover:bg-white/5 transition duration-150 text-base"
              >
                <td className="py-4 px-4">
                  {issue.mediaUrl ? (
                    issue.mediaUrl.includes('.mp4') || issue.mediaUrl.includes('.mov') ? (
                      <span className="text-teal-400 text-sm font-bold">VIDEO</span>
                    ) : (
                      <img
                        src={issue.mediaUrl}
                        alt="Report media"
                        className="w-12 h-12 object-cover rounded-md border border-gray-700"
                      />
                    )
                  ) : (
                    <span className="text-gray-600 text-sm">N/A</span>
                  )}
                </td>

                <td className="py-4 px-4 font-medium text-white max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                  <Link to={`/issues/${issue._id}`} className="hover:text-teal-400 transition">
                    {issue.title}
                  </Link>
                </td>

                <td className="py-4 px-4 text-gray-300">{issue.category}</td>

                <td className="py-4 px-4">
                  <StatusBadge status={issue.status} />
                </td>

                <td className="py-4 px-4 text-gray-300">
                  {issue.verifications?.length || 0}
                </td>

                <td className="py-4 px-4 text-gray-400">
                  {new Date(issue.createdAt).toLocaleDateString()}
                </td>

                <td className="py-4 px-4">
                  <Link
                    to={`/issues/${issue._id}`}
                    className="text-teal-400 hover:text-teal-300 text-sm font-bold"
                  >
                    VIEW
                  </Link>
                </td>
              </tr>
            ))}

            {sortedIssues.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-10 text-gray-400">
                  No reports found matching the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllReports;
