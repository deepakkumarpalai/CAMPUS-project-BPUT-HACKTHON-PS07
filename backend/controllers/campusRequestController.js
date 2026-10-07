const CampusRequest = require('../models/CampusRequest');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { validateCampusRequest } = require('../validators/requestValidator');
const { analyzeRequest, mapServiceCategory } = require('../services/aiService');
const { createNotification, notifyAdmins } = require('../services/notificationService');

const getCampusRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'STUDENT') filter.submittedBy = req.user._id;
  if (req.user.role === 'FACULTY' && req.query.mine === 'true') filter.submittedBy = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const requests = await CampusRequest.find(filter)
    .populate('submittedBy', 'name role department')
    .populate('assignedTo', 'name role')
    .populate('aiAnalysis')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: requests.length, data: requests });
});

const getCampusRequestById = asyncHandler(async (req, res) => {
  const request = await CampusRequest.findById(req.params.id)
    .populate('submittedBy', 'name role department')
    .populate('assignedTo', 'name role')
    .populate('aiAnalysis');
  if (!request) return res.status(404).json({ success: false, message: 'Campus request not found.' });
  res.json({ success: true, data: request });
});

const createCampusRequest = asyncHandler(async (req, res) => {
  const errors = validateCampusRequest(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

  const request = await CampusRequest.create({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category || 'Other',
    location: req.body.location,
    submittedBy: req.user._id
  });

  const analysis = await analyzeRequest({
    sourceType: 'CAMPUS_REQUEST',
    sourceId: request._id,
    title: request.title,
    description: request.description,
    location: request.location
  });

  request.category = req.body.category || mapServiceCategory(analysis.category);
  request.aiRecommendedPriority = analysis.priority;
  request.priority = analysis.priority;
  request.finalPriority = analysis.priority;
  request.priorityReason = analysis.reason;
  request.aiAnalysis = analysis._id;
  await request.save();

  await notifyAdmins({
    title: 'New campus service request',
    message: `${request.title} (${analysis.analysisMode === 'AI' ? 'AI Analysis' : 'Rule-Based Analysis'})`,
    type: 'SERVICE'
  });

  const populated = await CampusRequest.findById(request._id).populate('aiAnalysis');
  res.status(201).json({ success: true, data: populated });
});

const updateCampusRequest = asyncHandler(async (req, res) => {
  const request = await CampusRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: 'Campus request not found.' });

  if (req.user.role === 'STUDENT') {
    return res.status(403).json({ success: false, message: 'Students cannot update service workflow fields.' });
  }

  const previousStatus = request.status;
  ['category', 'status', 'assignedTo', 'location', 'adminRemarks', 'priority', 'finalPriority'].forEach((field) => {
    if (req.body[field] !== undefined) request[field] = req.body[field];
  });
  if (req.body.status === 'RESOLVED') request.resolvedAt = new Date();
  const updated = await request.save();

  if (req.body.status && req.body.status !== previousStatus) {
    await createNotification({
      user: updated.submittedBy,
      title: 'Service request updated',
      message: `Your service request "${updated.title}" is now ${updated.status}.`,
      type: 'SERVICE'
    });
  }
  const populated = await CampusRequest.findById(updated._id).populate('aiAnalysis').populate('assignedTo', 'name');
  res.json({ success: true, data: populated });
});

module.exports = { getCampusRequests, getCampusRequestById, createCampusRequest, updateCampusRequest };
