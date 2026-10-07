const mongoose = require('mongoose');

const feeAccountSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseName: { type: String, required: true, trim: true },
    academicYear: { type: String, required: true, trim: true },
    totalFeePaise: { type: Number, required: true, min: 1 },
    paidFeePaise: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR', enum: ['INR'] },
    dueDate: { type: Date },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    pendingPaymentReceipt: { type: String, default: null },
    pendingPaymentExpiresAt: { type: Date, default: null },
    pendingOrderId: { type: String, default: null }
  },
  { timestamps: true }
);

feeAccountSchema.index({ user: 1, courseName: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('FeeAccount', feeAccountSchema);
