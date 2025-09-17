import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    roomNumber: {
        type: String,
        required: [true, "Room no is required"],
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['electrical', 'plumbing', 'wifi', 'cleaning', 'security', 'noise', 'furniture', 'other']
    },
    priority: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    description: {
        type: String,
        required: [true,"Description  is required"],
        trim: true
    },
    contactNumber: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved'],
        default: 'pending'
    },
    submittedDate: {
        type: Date,
        default: Date.now
    },
    resolvedDate: {
        type: Date,
        default: null
    },
    resolution: {
        type: String,
        default: null,
        trim: true
    }
}, {
    timestamps: true // This adds createdAt and updatedAt fields
});

// Create indexes for better query performance
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ submittedDate: -1 });
complaintSchema.index({ roomNumber: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;

