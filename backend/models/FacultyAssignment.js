const mongoose = require('mongoose');

const facultyAssignmentSchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true, trim: true },
    teacherName: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    branch: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

facultyAssignmentSchema.index(
  { teacherId: 1, subject: 1, semester: 1, branch: 1, className: 1, section: 1 },
  { unique: true }
);

module.exports = mongoose.model('FacultyAssignment', facultyAssignmentSchema);
