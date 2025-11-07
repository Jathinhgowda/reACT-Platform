// src/components/auth/LoginForm.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/App-logo.png'; // <-- IMPORT THE IMAGE FILE

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userData = await login(email, password);
      
      if (userData.role === 'Authority' || userData.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = typeof err === 'string' ? err : err.message || 'Login failed. Check your network.';
      setError(errorMessage); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
        
        <div className="flex justify-center flex-col items-center mb-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden"> {/* ⬅️ Increased size from 12 to 16 */}
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain scale-110" />
                ) : (
                  <HiOutlineUserCircle className="text-indigo-600 text-4xl" />
                )}
              </div>
            </Link>
        </div>
        
        <h2 className="text-3xl font-bold text-teal-400 mb-6 text-center">Log In</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Input */}
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400">Email Address</label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-3 bg-gray-800 text-white focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {/* Password Input */}
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400">Password</label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-3 bg-gray-800 text-white focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="text-red-400 bg-red-900/40 p-3 rounded-lg border border-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Submit Button */}
            <div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-bold text-gray-900 bg-teal-400 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition duration-150"
                >
                    {loading ? 'Logging In...' : 'Log In'}
                </button>
            </div>
        </form>
    </div>
  );
};

export default LoginForm;
