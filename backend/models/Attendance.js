const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE'], required: true },
    semester: { type: String, default: '1' },
    department: { type: String, default: '' }
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
