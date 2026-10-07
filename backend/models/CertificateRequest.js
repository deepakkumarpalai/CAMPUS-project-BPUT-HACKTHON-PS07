const mongoose = require('mongoose');

const certificateRequestSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    certificateType: {
      type: String,
      enum: ['BONAFIDE', 'CHARACTER', 'STUDY', 'OTHER'],
      required: true
    },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'READY', 'REJECTED'],
      default: 'PENDING'
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CertificateRequest', certificateRequestSchema);
