const mongoose = require('mongoose');

const campusRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'Electrical',
        'Water',
        'Cleaning',
        'IT Support',
        'Furniture',
        'Classroom',
        'Hostel',
        'Library',
        'Transport',
        'Other'
      ],
      default: 'Other'
    },
    location: { type: String, default: '' },
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
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'],
      default: 'PENDING'
    },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminRemarks: { type: String, default: '' },
    aiAnalysis: { type: mongoose.Schema.Types.ObjectId, ref: 'AIAnalysis' },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CampusRequest', campusRequestSchema);
