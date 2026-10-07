const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, default: 'GENERAL' },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'FACULTY', 'SPECIFIC_DEPARTMENT'],
      default: 'ALL'
    },
    department: { type: String, default: '' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
