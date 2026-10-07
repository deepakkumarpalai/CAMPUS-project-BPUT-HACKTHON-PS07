const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: true, trim: true },
    subjectName: { type: String, required: true, trim: true },
    credits: { type: Number, default: null, min: 0 },
    internalMarks: { type: Number, default: null, min: 0 },
    externalMarks: { type: Number, default: null, min: 0 },
    totalMarks: { type: Number, default: null, min: 0 },
    grade: { type: String, default: '', trim: true },
    attendancePercent: { type: Number, default: null, min: 0, max: 100 },
    sgpa: { type: Number, default: null, min: 0, max: 10 },
    marksStatus: {
      type: String,
      enum: ['PROVIDED', 'SAMPLE', 'DEMO', 'NO_NUMERIC_MARKS'],
      required: true
    }
  },
  { _id: false }
);

const semesterSchema = new mongoose.Schema(
  {
    semester: { type: Number, required: true, min: 1, max: 8 },
    courses: { type: [courseSchema], default: [] }
  },
  { _id: false }
);

const academicRecordSchema = new mongoose.Schema(
  {
    registrationNo: { type: String, required: true, trim: true, unique: true, index: true },
    studentName: { type: String, required: true, trim: true },
    semesters: { type: [semesterSchema], default: [] },
    semesterSgpa: {
      type: [{ semester: { type: Number, required: true }, sgpa: { type: Number, default: null } }],
      default: []
    },
    currentCgpa: { type: Number, default: null, min: 0, max: 10 },
    hasSampleData: { type: Boolean, default: false },
    sourceNotes: { type: [String], default: [] },
    importedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);
