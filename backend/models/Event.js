const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    kind: { type: String, enum: ['EVENT', 'HOLIDAY'], default: 'EVENT' },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    location: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
