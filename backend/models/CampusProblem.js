const mongoose = require('mongoose');

const campusProblemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    category: {
      type: String,
      enum: ['GENERAL', 'ACADEMIC', 'RESULT', 'FACILITY', 'OTHER'],
      default: 'GENERAL'
    },
    contactPhone: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CampusProblem', campusProblemSchema);
