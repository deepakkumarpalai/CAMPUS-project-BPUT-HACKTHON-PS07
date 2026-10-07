const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    feeAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeAccount', required: true },
    orderId: { type: String, required: true, unique: true },
    paymentId: { type: String, unique: true, sparse: true },
    amountPaise: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR', enum: ['INR'] },
    method: { type: String, default: '' },
    status: { type: String, enum: ['PENDING', 'PAID', 'EXPIRED'], default: 'PENDING' },
    paidAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
