// src/pages/ReportIssue.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportNewIssue } from '../services/issueApi';
// Assuming EXIF reader is correctly available (as per original code)
import EXIF from 'exif-js'; 

const categories = ['Roads', 'Waste', 'Water', 'Electricity', 'Other'];

// Toast component (Updated for Dark Theme)
const Toast = ({ message, type = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Use dark theme appropriate colors for Toast
  const bgColor = type === 'error' 
    ? 'bg-red-900/80 text-red-300 border border-red-700' 
    : 'bg-green-900/80 text-green-300 border border-green-700';

  return (
    <div className={`fixed top-5 right-5 p-4 rounded-xl shadow-2xl backdrop-blur-sm ${bgColor} z-50 animate-slide-in`}>
      {message}
    </div>
  );
};

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: categories[0],
    media: null,
    userLat: '',
    userLon: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Fetching location...');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Get Browser Geolocation (Functionality preserved)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            userLat: position.coords.latitude,
            userLon: position.coords.longitude
          }));
          setLocationStatus('Location found from browser GPS.');
        },
        (err) => {
          setLocationStatus(`Location permission denied or failed (${err.message}). Coordinates will be attempted from photo EXIF data.`);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationStatus('Geolocation not supported. Coordinates will be attempted from photo EXIF data.');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // handleFileChange (Functionality preserved)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, media: file }));

    if (!formData.userLat && file && file.type.startsWith('image/')) {
      EXIF.getData(file, function () {
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const lon = EXIF.getTag(this, 'GPSLongitude');
        const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
        const lonRef = EXIF.getTag(this, 'GPSLongitudeRef');

        if (lat && lon && latRef && lonRef) {
          const dmsToDd = (dms, ref) => {
            const [deg, min, sec] = dms;
            let dd = deg + min / 60 + sec / 3600;
            if (ref === 'S' || ref === 'W') dd *= -1;
            return dd;
          };
          const latitude = dmsToDd(lat, latRef);
          const longitude = dmsToDd(lon, lonRef);
          setFormData(prev => ({ ...prev, userLat: latitude, userLon: longitude }));
          setLocationStatus('Location obtained from image EXIF data.');
        }
      });
    }
  };

  // handleSubmit (Functionality preserved)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('category', formData.category);
    if (formData.media) data.append('media', formData.media);
    if (formData.userLat && formData.userLon) {
      data.append('userLat', formData.userLat);
      data.append('userLon', formData.userLon);
    }

    try {
      await reportNewIssue(data);
      setToast({ message: 'Issue reported successfully!', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setError(err?.message || 'Failed to report issue');
      setToast({ message: err?.message || 'Failed to report issue', type: 'error' });
      setLoading(false);
    }
  };

  return (
    // Set the overall dark background for the page container
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
        
        {/* Form Container with Glassy style */}
        <div className="max-w-2xl mx-auto glass-card p-6 rounded-xl shadow-2xl border border-gray-700">
            <h1 className="text-3xl font-bold text-teal-400 mb-6 border-b border-gray-700 pb-3">Report a New Issue</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Location Status Display (Updated for Dark Theme) */}
                <div className={`p-3 text-sm rounded-md border ${formData.userLat 
                    ? 'bg-green-900/50 text-green-300 border-green-700' 
                    : 'bg-yellow-900/50 text-yellow-300 border-yellow-700'}`}
                >
                    <span className="font-semibold">Location Status:</span> {locationStatus}
                    {formData.userLat && <p className="mt-1">Current GPS: {formData.userLat}, {formData.userLon}</p>}
                </div>

                {/* Title Input */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-400">Title</label>
                    <input 
                        type="text" name="title" id="title" value={formData.title} onChange={handleChange} required 
                        // Sleek dark input styling
                        className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-3 bg-gray-800 text-white focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Description Input */}
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-400">Description</label>
                    <textarea 
                        name="description" id="description" rows="4" value={formData.description} onChange={handleChange} required 
                        // Sleek dark input styling
                        className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-3 bg-gray-800 text-white focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Category Select */}
                <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-400">Category</label>
                    <select 
                        name="category" id="category" value={formData.category} onChange={handleChange} 
                        // Sleek dark input styling
                        className="mt-1 block w-full border border-gray-700 rounded-lg shadow-sm p-3 bg-gray-800 text-white focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        {categories.map(cat => <option key={cat} value={cat} className='bg-gray-800'>{cat}</option>)}
                    </select>
                </div>

                {/* Media Upload */}
                <div>
                    <label htmlFor="media" className="block text-sm font-medium text-gray-400">Photo/Video (Optional)</label>
                    <input 
                        type="file" name="media" id="media" onChange={handleFileChange} accept="image/*,video/*" 
                        // Style file input for dark theme
                        className="mt-1 block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-900/50 file:text-indigo-300 hover:file:bg-indigo-900/80"
                    />
                    <p className="mt-1 text-xs text-gray-500">Max size: 10MB. GPS will be read from image EXIF if browser location is unavailable.</p>
                </div>

                {/* Error message (Styled for dark theme) */}
                {error && <div className="text-red-400 p-2 border border-red-700 rounded bg-red-900/50 mt-4">{error}</div>}

                {/* Submit Button - Teal Accent */}
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-lg font-bold text-gray-900 bg-teal-400 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition duration-150"
                >
                    {loading ? 'Submitting...' : 'Submit Issue'}
                </button>
            </form>

            {/* Toast Notifications */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    </div>
  );
};

export default ReportIssue;