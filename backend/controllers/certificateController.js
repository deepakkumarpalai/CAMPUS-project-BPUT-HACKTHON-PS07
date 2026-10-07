const CertificateRequest = require('../models/CertificateRequest');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { validateCertificate } = require('../validators/requestValidator');
const { createNotification, notifyAdmins } = require('../services/notificationService');

const getCertificates = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'STUDENT') filter.student = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const requests = await CertificateRequest.find(filter)
    .populate('student', 'name studentId department')
    .populate('reviewedBy', 'name role')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: requests.length, data: requests });
});

const getCertificateById = asyncHandler(async (req, res) => {
  const request = await CertificateRequest.findById(req.params.id)
    .populate('student', 'name studentId department')
    .populate('reviewedBy', 'name role');
  if (!request) return res.status(404).json({ success: false, message: 'Certificate request not found.' });
  res.json({ success: true, data: request });
});

const createCertificate = asyncHandler(async (req, res) => {
  const errors = validateCertificate(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

  const request = await CertificateRequest.create({
    student: req.user._id,
    certificateType: req.body.certificateType,
    reason: req.body.reason
  });
  await notifyAdmins({
    title: 'New certificate request',
    message: `${req.user.name} requested a ${req.body.certificateType} certificate.`,
    type: 'CERTIFICATE'
  });
  res.status(201).json({ success: true, data: request });
});

const updateCertificate = asyncHandler(async (req, res) => {
  const request = await CertificateRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: 'Certificate request not found.' });

  if (req.body.status) {
    request.status = req.body.status;
    request.reviewedBy = req.user._id;
  }
  if (req.body.remarks !== undefined) request.remarks = req.body.remarks;
  const updated = await request.save();

  await createNotification({
    user: updated.student,
    title: 'Certificate request updated',
    message: `Your certificate request is now ${updated.status}.`,
    type: 'CERTIFICATE'
  });
  res.json({ success: true, data: updated });
});

module.exports = { getCertificates, getCertificateById, createCertificate, updateCertificate };
