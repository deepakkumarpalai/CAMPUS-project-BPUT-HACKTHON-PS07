const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'ACADEMIC',
        'HOSTEL',
        'MESS',
        'ELECTRICAL',
        'WATER',
        'CLEANLINESS',
        'SECURITY',
        'IT',
        'TRANSPORT',
        'LIBRARY',
        'ADMINISTRATION',
        'OTHER'
      ],
      default: 'OTHER'
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    aiRecommendedPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    finalPriority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    },
    priorityReason: { type: String, default: '' },
    priorityReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    priorityReviewedAt: { type: Date },
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
      default: 'PENDING'
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    department: { type: String, default: '' },
    location: { type: String, default: '' },
    attachments: [{ type: String }],
    adminRemarks: { type: String, default: '' },
    linkedComplaints: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' }],
    mergedInto: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    aiAnalysis: { type: mongoose.Schema.Types.ObjectId, ref: 'AIAnalysis' },
    resolvedAt: { type: Date },
    dueAt: { type: Date },
    lastEscalatedAt: { type: Date },
    escalationCount: { type: Number, default: 0 },
    recurrenceCount: { type: Number, default: 1 },
    isRecurring: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
