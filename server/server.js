const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows parsing of application/json
app.use(express.urlencoded({ extended: false })); // Allows parsing of application/x-www-form-urlencoded

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/gamification', require('./routes/gamificationRoutes')); // New route file
app.use('/api/analytics', require('./routes/analyticsRoutes'));       // New route file
app.use('/api/notifications', require('./routes/notificationRoutes'))
app.use('/api/campaigns', require('./routes/campaignRoutes')); // V1.2: New Route
app.use('/api/quizzes', require('./routes/quizRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'))

// Simple default route
app.get('/', (req, res) => {
    res.send('reACT API is running...');
});

app.listen(port, () => console.log(`Server started on port ${port}`));
