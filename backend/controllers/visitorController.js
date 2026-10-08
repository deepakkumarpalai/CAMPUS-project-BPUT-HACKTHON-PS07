const { randomBytes } = require('crypto');
const VisitorPass = require('../models/VisitorPass');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { EMAIL_REGEX, PHONE_REGEX } = require('../validators/authValidator');
const { notifyAdmins } = require('../services/notificationService');
const { recordAudit } = require('../services/auditService');

const createVisitorRequest = asyncHandler(async (req, res) => {
  const { visitorName, email, phone, organization, purpose, hostName, visitStart, visitEnd } = req.body;
  const start = new Date(visitStart);
  const end = new Date(visitEnd);
  const errors = [];

  if (typeof visitorName !== 'string' || !visitorName.trim() || visitorName.length > 100) errors.push('Enter a visitor name (up to 100 characters).');
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email)) errors.push('Enter a valid email address.');
  if (typeof phone !== 'string' || !PHONE_REGEX.test(phone)) errors.push('Enter a valid phone number.');
  if (typeof purpose !== 'string' || !purpose.trim() || purpose.length > 500) errors.push('Enter a visit purpose (up to 500 characters).');
  if (typeof hostName !== 'string' || !hostName.trim() || hostName.length > 100) errors.push('Enter the campus host name.');
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start <= new Date() || end <= start) {
    errors.push('Choose a future visit time and a later end time.');
  }
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

  const visitor = await VisitorPass.create({
    visitorName,
    email,
    phone,
    organization,
    purpose,
    hostName,
    visitStart: start,
    visitEnd: end,
    referenceCode: randomBytes(24).toString('hex')
  });

  await notifyAdmins({
    title: 'New visitor request',
    message: `${visitor.visitorName} requested a campus visit for ${visitor.visitStart.toLocaleString()}.`,
    type: 'SYSTEM'
  });

  res.status(201).json({ success: true, data: { referenceCode: visitor.referenceCode, status: visitor.status } });
});

const getVisitorStatus = asyncHandler(async (req, res) => {
  const visitor = await VisitorPass.findOne({ referenceCode: req.params.referenceCode })
    .select('+referenceCode +qrToken');
  if (!visitor) return res.status(404).json({ success: false, message: 'Visitor request not found.' });

  res.json({
    success: true,
    data: {
      visitorName: visitor.visitorName,
      hostName: visitor.hostName,
      purpose: visitor.purpose,
      visitStart: visitor.visitStart,
      visitEnd: visitor.visitEnd,
      status: visitor.status,
      qrToken: visitor.status === 'APPROVED' ? visitor.qrToken : undefined
    }
  });
});

const listVisitorRequests = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  const visitors = await VisitorPass.find(filter)
    .populate('approvedBy', 'name')
    .sort({ visitStart: 1 })
    .limit(200);
  res.json({ success: true, count: visitors.length, data: visitors });
});

const decideVisitorRequest = asyncHandler(async (req, res) => {
  if (!['APPROVED', 'REJECTED'].includes(req.body.status)) {
    return res.status(400).json({ success: false, message: 'Choose APPROVED or REJECTED.' });
  }

  const visitor = await VisitorPass.findById(req.params.id).select('+qrToken');
  if (!visitor) return res.status(404).json({ success: false, message: 'Visitor request not found.' });
  if (visitor.status !== 'PENDING') {
    return res.status(409).json({ success: false, message: 'This visitor request has already been reviewed.' });
  }

  visitor.status = req.body.status;
  visitor.approvedBy = req.user._id;
  if (req.body.status === 'APPROVED') visitor.qrToken = randomBytes(32).toString('hex');
  await visitor.save();
  await recordAudit({ actor: req.user, action: `VISITOR_${visitor.status}`, entityType: 'VISITOR_PASS', entityId: visitor._id });
  res.json({ success: true, data: { id: visitor._id, status: visitor.status } });
});

const verifyVisitorQr = asyncHandler(async (req, res) => {
  if (typeof req.body.qrToken !== 'string' || !req.body.qrToken) {
    return res.status(400).json({ success: false, message: 'A visitor QR token is required.' });
  }

  const visitor = await VisitorPass.findOne({ qrToken: req.body.qrToken }).select('+qrToken');
  if (!visitor) return res.status(404).json({ success: false, message: 'QR code is invalid or expired.' });

  const now = new Date();
  if (now < visitor.visitStart || now > visitor.visitEnd) {
    return res.status(409).json({ success: false, message: 'This pass is outside its approved visit time.' });
  }
  const action = visitor.status === 'APPROVED' ? 'VISITOR_CHECK_IN' : 'VISITOR_CHECK_OUT';
  if (visitor.status === 'APPROVED') {
    visitor.status = 'CHECKED_IN';
    visitor.checkedInAt = now;
    visitor.checkedInBy = req.user._id;
  } else if (visitor.status === 'CHECKED_IN') {
    visitor.status = 'COMPLETED';
    visitor.checkedOutAt = now;
    visitor.checkedOutBy = req.user._id;
  } else {
    return res.status(409).json({ success: false, message: 'This pass cannot be used again.' });
  }

  await visitor.save();
  await recordAudit({ actor: req.user, action, entityType: 'VISITOR_PASS', entityId: visitor._id, details: visitor.status });
  res.json({
    success: true,
    data: {
      visitorName: visitor.visitorName,
      hostName: visitor.hostName,
      status: visitor.status,
      checkedInAt: visitor.checkedInAt,
      checkedOutAt: visitor.checkedOutAt
    }
  });
});

module.exports = {
  createVisitorRequest,
  getVisitorStatus,
  listVisitorRequests,
  decideVisitorRequest,
  verifyVisitorQr
};