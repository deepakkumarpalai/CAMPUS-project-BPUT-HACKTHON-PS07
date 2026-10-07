const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    marks: { type: Number, required: true, min: 0 },
    remarks: { type: String, trim: true, default: '' }
  },
  { timestamps: true }
);

const examSchema = new mongoose.Schema(
  {
    course: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    examType: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    venue: { type: String, trim: true, default: '' },
    maxMarks: { type: Number, required: true, min: 1 },
    results: [examResultSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);
