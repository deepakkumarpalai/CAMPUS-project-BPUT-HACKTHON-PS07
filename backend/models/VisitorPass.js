const mongoose = require('mongoose');

const visitorPassSchema = new mongoose.Schema(
  {
    visitorName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    organization: { type: String, trim: true, maxlength: 120, default: '' },
    purpose: { type: String, required: true, trim: true, maxlength: 500 },
    hostName: { type: String, required: true, trim: true, maxlength: 100 },
    visitStart: { type: Date, required: true },
    visitEnd: { type: Date, required: true },
    referenceCode: { type: String, required: true, unique: true, select: false },
    qrToken: { type: String, unique: true, sparse: true, select: false },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'COMPLETED'],
      default: 'PENDING'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedInAt: { type: Date },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedOutAt: { type: Date },
    checkedOutBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('VisitorPass', visitorPassSchema);