const Exam = require('../models/Exam');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find()
    .populate('results.student', 'name email studentId')
    .sort({ date: 1, startTime: 1 });
  const data = exams.map((exam) => {
    const item = exam.toObject();
    if (req.user.role !== 'ADMIN') {
      item.results = req.user.role === 'STUDENT'
        ? item.results.filter((result) => result.student?._id?.toString() === req.user._id.toString())
        : [];
    }
    return item;
  });
  res.json({ success: true, count: data.length, data });
});

const createExam = asyncHandler(async (req, res) => {
  const { course, subject, examType, date, startTime, endTime, venue, maxMarks } = req.body;
  if (!course || !subject || !examType || !date || !startTime || !endTime || !Number.isFinite(Number(maxMarks))) {
    return res.status(400).json({ success: false, message: 'Course, subject, exam type, date, times, and maximum marks are required.' });
  }
  if (Number(maxMarks) < 1 || Number.isNaN(new Date(date).getTime())) {
    return res.status(400).json({ success: false, message: 'Enter a valid exam date and maximum marks.' });
  }
  const exam = await Exam.create({
    course, subject, examType, date, startTime, endTime, venue, maxMarks, createdBy: req.user._id
  });
  res.status(201).json({ success: true, data: exam });
});

const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
  const allowed = ['course', 'subject', 'examType', 'date', 'startTime', 'endTime', 'venue', 'maxMarks'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) exam[field] = req.body[field];
  });
  if (!exam.course || !exam.subject || !exam.examType || !exam.startTime || !exam.endTime || exam.maxMarks < 1) {
    return res.status(400).json({ success: false, message: 'Complete all required exam fields.' });
  }
  await exam.save();
  res.json({ success: true, data: exam });
});

const setExamResult = asyncHandler(async (req, res) => {
  const { studentId, marks, remarks = '' } = req.body;
  const numericMarks = Number(marks);
  if (!studentId || !Number.isFinite(numericMarks)) {
    return res.status(400).json({ success: false, message: 'A student and valid marks are required.' });
  }
  const [exam, student] = await Promise.all([
    Exam.findById(req.params.id),
    User.findOne({ _id: studentId, role: 'STUDENT' }).select('_id')
  ]);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
  if (numericMarks < 0 || numericMarks > exam.maxMarks) {
    return res.status(400).json({ success: false, message: `Marks must be between 0 and ${exam.maxMarks}.` });
  }
  const result = exam.results.find((entry) => entry.student.toString() === student._id.toString());
  if (result) {
    result.marks = numericMarks;
    result.remarks = remarks;
  } else {
    exam.results.push({ student: student._id, marks: numericMarks, remarks });
  }
  await exam.save();
  res.json({ success: true, data: exam });
});

const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findByIdAndDelete(req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
  res.json({ success: true, message: 'Exam deleted.' });
});

module.exports = { getExams, createExam, updateExam, setExamResult, deleteExam };
