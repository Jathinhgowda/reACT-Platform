const mongoose = require('mongoose');

// Define the schema for a single timeline entry separately for clarity
const timelineEntrySchema = new mongoose.Schema({
    status: { 
        type: String, 
        enum: ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected', 'Acknowledged', 'Scheduled'], // Extended status list
        required: true
    },
    comment: { type: String },
    date: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // V1.3: Proof of resolution (stored only in the 'Resolved' entry)
    resolutionMediaUrl: { type: String, default: null }, 
}, {
    // Avoid creating unnecessary default _id fields for subdocuments
    _id: false
});

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    date: { type: Date, default: Date.now },
}, {
    _id: true // Retain _id for comments for deletion/keying in React
});


const issueSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { 
        type: String, 
        enum: ['Roads', 'Waste', 'Water', 'Electricity', 'Other'], 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Pending', 'Verified', 'In Progress', 'Resolved', 'Rejected'], 
        default: 'Pending' 
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true },
    },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mediaUrl: { type: String }, // Original Citizen Upload URL
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    verifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Progress Tracking (Timeline of Status Changes & Actions)
    timeline: [timelineEntrySchema], // <-- Using the dedicated schema
    
    // Community Comments
    comments: [commentSchema], // <-- Using the dedicated schema (Fixed structure)

    // V1.3: Authority Assignment (Added in previous step)
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    
}, {
    timestamps: true,
    // CRITICAL FIX: Ensure all nested fields (like resolutionMediaUrl) are included in the JSON response
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true }
});

// Create a Geo-spatial index for efficient map querying
issueSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Issue', issueSchema);