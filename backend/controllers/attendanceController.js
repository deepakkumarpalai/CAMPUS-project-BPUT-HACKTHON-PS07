const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getAttendance = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'STUDENT') filter.student = req.user._id;
  if (req.query.student) filter.student = req.query.student;
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.date) {
    const day = new Date(req.query.date);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    filter.date = { $gte: day, $lt: next };
  }

  const records = await Attendance.find(filter)
    .populate('student', 'name studentId department')
    .populate('faculty', 'name facultyId')
    .sort({ date: -1 });

  res.json({ success: true, count: records.length, data: records });
});

const getAttendanceSummary = asyncHandler(async (req, res) => {
  const studentId = req.user.role === 'STUDENT' ? req.user._id : req.query.student;
  if (!studentId) {
    return res.status(400).json({ success: false, message: 'Student id is required.' });
  }

  const records = await Attendance.find({ student: studentId });
  const total = records.length;
  const present = records.filter((item) => item.status === 'PRESENT' || item.status === 'LATE').length;
  const overall = total ? Number(((present / total) * 100).toFixed(1)) : 0;

  const bySubject = {};
  records.forEach((item) => {
    if (!bySubject[item.subject]) bySubject[item.subject] = { total: 0, present: 0 };
    bySubject[item.subject].total += 1;
    if (item.status === 'PRESENT' || item.status === 'LATE') bySubject[item.subject].present += 1;
  });

  const subjectWise = Object.entries(bySubject).map(([subject, stats]) => ({
    subject,
    total: stats.total,
    present: stats.present,
    percentage: Number(((stats.present / stats.total) * 100).toFixed(1))
  }));

  res.json({
    success: true,
    data: { total, present, overall, subjectWise, records }
  });
});

const createAttendance = asyncHandler(async (req, res) => {
  const { records, student, subject, date, status, semester, department } = req.body;

  if (Array.isArray(records) && records.length) {
    const created = await Attendance.insertMany(
      records.map((item) => ({
        student: item.student,
        faculty: req.user._id,
        subject: item.subject || subject,
        date: item.date || date,
        status: item.status,
        semester: item.semester || semester,
        department: item.department || department
      })),
      { ordered: false }
    ).catch((error) => {
      if (error.insertedDocs) return error.insertedDocs;
      throw error;
    });
    return res.status(201).json({ success: true, count: created.length, data: created });
  }

  if (!student || !subject || !date || !status) {
    return res.status(400).json({ success: false, message: 'student, subject, date and status are required.' });
  }

  const record = await Attendance.create({
    student,
    faculty: req.user._id,
    subject,
    date,
    status,
    semester,
    department
  });
  res.status(201).json({ success: true, data: record });
});

const updateAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found.' });
  Object.assign(record, req.body);
  const updated = await record.save();
  res.json({ success: true, data: updated });
});

const deleteAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found.' });
  await record.deleteOne();
  res.json({ success: true, message: 'Attendance record deleted.' });
});

const getStudentsForAttendance = asyncHandler(async (req, res) => {
  const filter = { role: 'STUDENT' };
  if (req.query.department) filter.department = req.query.department;
  const students = await User.find(filter).select('name studentId department email');
  res.json({ success: true, data: students });
});

module.exports = {
  getAttendance,
  getAttendanceSummary,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getStudentsForAttendance
};
