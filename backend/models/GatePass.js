const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    destination: { type: String, required: true },
    reason: { type: String, required: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    emergencyContact: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('GatePass', gatePassSchema);
