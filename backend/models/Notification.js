const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['NOTICE', 'COMPLAINT', 'LEAVE', 'CERTIFICATE', 'GATE_PASS', 'SERVICE', 'EVENT', 'SYSTEM'],
      default: 'SYSTEM'
    },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
