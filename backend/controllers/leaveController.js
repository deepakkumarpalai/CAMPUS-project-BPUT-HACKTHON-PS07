const LeaveRequest = require('../models/LeaveRequest');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { validateLeave } = require('../validators/requestValidator');
const { createNotification, notifyAdmins } = require('../services/notificationService');

const getLeaveRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'STUDENT') filter.student = req.user._id;
  if (req.query.status) filter.status = req.query.status;

  const requests = await LeaveRequest.find(filter)
    .populate('student', 'name studentId department')
    .populate('reviewedBy', 'name role')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: requests.length, data: requests });
});

const getLeaveById = asyncHandler(async (req, res) => {
  const request = await LeaveRequest.findById(req.params.id)
    .populate('student', 'name studentId department')
    .populate('reviewedBy', 'name role');
  if (!request) return res.status(404).json({ success: false, message: 'Leave request not found.' });
  if (req.user.role === 'STUDENT' && request.student._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  res.json({ success: true, data: request });
});

const createLeaveRequest = asyncHandler(async (req, res) => {
  const errors = validateLeave(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

  const request = await LeaveRequest.create({
    student: req.user._id,
    leaveType: req.body.leaveType,
    fromDate: req.body.fromDate,
    toDate: req.body.toDate,
    reason: req.body.reason,
    attachment: req.file ? `/uploads/${req.file.filename}` : req.body.attachment || ''
  });

  await notifyAdmins({
    title: 'New leave request',
    message: `${req.user.name} submitted a leave request.`,
    type: 'LEAVE'
  });

  res.status(201).json({ success: true, data: request });
});

const updateLeaveRequest = asyncHandler(async (req, res) => {
  const request = await LeaveRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: 'Leave request not found.' });

  if (req.user.role === 'STUDENT') {
    if (request.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be updated.' });
    }
    request.reason = req.body.reason || request.reason;
    request.fromDate = req.body.fromDate || request.fromDate;
    request.toDate = req.body.toDate || request.toDate;
    request.leaveType = req.body.leaveType || request.leaveType;
  } else {
    if (req.body.status) {
      request.status = req.body.status;
      request.reviewedBy = req.user._id;
      request.reviewedAt = new Date();
    }
    if (req.body.remarks !== undefined) request.remarks = req.body.remarks;
  }

  const updated = await request.save();
  if (['APPROVED', 'REJECTED'].includes(updated.status)) {
    await createNotification({
      user: updated.student,
      title: `Leave request ${updated.status.toLowerCase()}`,
      message: updated.remarks || `Your leave request was ${updated.status.toLowerCase()}.`,
      type: 'LEAVE'
    });
  }
  res.json({ success: true, data: updated });
});

module.exports = { getLeaveRequests, getLeaveById, createLeaveRequest, updateLeaveRequest };
