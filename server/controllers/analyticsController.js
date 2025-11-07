// server/controllers/analyticsController.js

const Issue = require('../models/Issue');

// @desc    Get issue summary counts
// @route   GET /api/analytics/summary
// @access  Private (Admin/Authority)
exports.getIssueSummary = async (req, res) => {
  try {
    const summary = await Issue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Format the result into a key-value object
    const result = summary.reduce((acc, item) => {
      acc[item._id.toLowerCase().replace(' ', '')] = item.count;
      return acc;
    }, {});

    const total = summary.reduce((sum, item) => sum + item.count, 0);

    res.status(200).json({
      total,
      pending: result.pending || 0,
      verified: result.verified || 0,
      inprogress: result.inprogress || 0,
      resolved: result.resolved || 0,
      rejected: result.rejected || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch issue summary' });
  }
};

// @desc    Get geo data aggregated by status for heatmap/dashboard
// @route   GET /api/analytics/geo
// @access  Public
exports.getGeoAnalytics = async (req, res) => {
  try {
    // We only need the coordinates and status for the heatmap
    const geoData = await Issue.find().select('location status');
    
    // Format for client-side processing (e.g., Leaflet.heat expects [lat, lon, intensity])
    // The client will handle the grouping/intensity based on status.
    const formattedData = geoData.map(issue => ({
        lat: issue.location.coordinates[1], // Latitude
        lon: issue.location.coordinates[0], // Longitude
        status: issue.status,
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch geo analytics' });
  }
};