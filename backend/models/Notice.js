const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, default: 'GENERAL' },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'FACULTY', 'SPECIFIC_DEPARTMENT', 'SPECIFIC_ROLE', 'SPECIFIC_YEAR', 'SPECIFIC_GROUP'],
      default: 'ALL'
    },
    department: { type: String, default: '' },
    targetRole: { type: String, enum: ['STUDENT', 'FACULTY', 'ADMIN', 'SECURITY'] },
    targetYear: { type: Number, min: 1, max: 6 },
    targetGroup: { type: String, trim: true, maxlength: 40 },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notice', noticeSchema);
