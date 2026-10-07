const GatePass = require('../models/GatePass');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { validateGatePass } = require('../validators/requestValidator');
const { createNotification, notifyAdmins } = require('../services/notificationService');

const getGatePasses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'STUDENT') filter.student = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const requests = await GatePass.find(filter)
    .populate('student', 'name studentId department phone')
    .populate('approvedBy', 'name role')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: requests.length, data: requests });
});

const getGatePassById = asyncHandler(async (req, res) => {
  const request = await GatePass.findById(req.params.id)
    .populate('student', 'name studentId department phone')
    .populate('approvedBy', 'name role');
  if (!request) return res.status(404).json({ success: false, message: 'Gate pass not found.' });
  res.json({ success: true, data: request });
});

const createGatePass = asyncHandler(async (req, res) => {
  const errors = validateGatePass(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

  const request = await GatePass.create({
    student: req.user._id,
    destination: req.body.destination,
    reason: req.body.reason,
    departureDate: req.body.departureDate,
    returnDate: req.body.returnDate,
    emergencyContact: req.body.emergencyContact
  });
  await notifyAdmins({
    title: 'New gate pass request',
    message: `${req.user.name} requested a gate pass to ${req.body.destination}.`,
    type: 'GATE_PASS'
  });
  res.status(201).json({ success: true, data: request });
});

const updateGatePass = asyncHandler(async (req, res) => {
  const request = await GatePass.findById(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: 'Gate pass not found.' });

  if (req.body.status) {
    request.status = req.body.status;
    request.approvedBy = req.user._id;
  }
  if (req.body.remarks !== undefined) request.remarks = req.body.remarks;
  const updated = await request.save();

  if (['APPROVED', 'REJECTED'].includes(updated.status)) {
    await createNotification({
      user: updated.student,
      title: `Gate pass ${updated.status.toLowerCase()}`,
      message: updated.remarks || `Your gate pass was ${updated.status.toLowerCase()}.`,
      type: 'GATE_PASS'
    });
  }
  res.json({ success: true, data: updated });
});

module.exports = { getGatePasses, getGatePassById, createGatePass, updateGatePass };
