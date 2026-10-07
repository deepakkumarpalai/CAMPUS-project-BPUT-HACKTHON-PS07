const Complaint = require('../models/Complaint');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { validateComplaint } = require('../validators/complaintValidator');
const { analyzeRequest } = require('../services/aiService');
const { createNotification, notifyAdmins } = require('../services/notificationService');

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const getComplaints = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'STUDENT') filter.submittedBy = req.user._id;
  if (req.user.role === 'FACULTY' && req.query.mine === 'true') filter.submittedBy = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { location: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const complaints = await Complaint.find(filter)
    .populate('submittedBy', 'name role department studentId facultyId')
    .populate('assignedTo', 'name role')
    .populate('priorityReviewedBy', 'name')
    .populate('aiAnalysis')
    .populate('linkedComplaints', 'title status priority')
    .sort({ createdAt: -1 });

  const sorted = complaints.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.finalPriority || a.priority] ?? 9;
    const pb = PRIORITY_ORDER[b.finalPriority || b.priority] ?? 9;
    return pa - pb;
  });

  res.json({ success: true, count: sorted.length, data: sorted });
});

const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('submittedBy', 'name role department email')
    .populate('assignedTo', 'name role')
    .populate('priorityReviewedBy', 'name')
    .populate('aiAnalysis')
    .populate('linkedComplaints', 'title status priority location');
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
  if (req.user.role === 'STUDENT' && complaint.submittedBy._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  res.json({ success: true, data: complaint });
});

const createComplaint = asyncHandler(async (req, res) => {
  const errors = validateComplaint(req.body);
  if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

  const attachments = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];
  const complaint = await Complaint.create({
    title: req.body.title,
    description: req.body.description,
    location: req.body.location,
    submittedBy: req.user._id,
    attachments,
    category: req.body.category || 'OTHER',
    department: req.body.department || req.user.department || ''
  });

  const analysis = await analyzeRequest({
    sourceType: 'COMPLAINT',
    sourceId: complaint._id,
    title: complaint.title,
    description: complaint.description,
    location: complaint.location
  });

  complaint.category = req.body.category || analysis.category || complaint.category;
  complaint.aiRecommendedPriority = analysis.priority;
  complaint.priority = analysis.priority;
  complaint.finalPriority = analysis.priority;
  complaint.priorityReason = analysis.reason;
  complaint.department = complaint.department || analysis.department;
  complaint.aiAnalysis = analysis._id;
  await complaint.save();

  await notifyAdmins({
    title: 'New complaint submitted',
    message: `${complaint.title} (${analysis.analysisMode === 'AI' ? 'AI Analysis' : 'Rule-Based Analysis'})`,
    type: 'COMPLAINT'
  });

  const populated = await Complaint.findById(complaint._id).populate('aiAnalysis');
  res.status(201).json({ success: true, data: populated });
});

const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  if (req.user.role === 'STUDENT') {
    return res.status(403).json({ success: false, message: 'Students cannot update complaint workflow fields.' });
  }

  const previousStatus = complaint.status;
  const updatable = [
    'category',
    'status',
    'assignedTo',
    'department',
    'location',
    'adminRemarks',
    'priority',
    'finalPriority',
    'linkedComplaints',
    'mergedInto'
  ];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) complaint[field] = req.body[field];
  });

  if (req.body.finalPriority || req.body.priority) {
    complaint.finalPriority = req.body.finalPriority || req.body.priority;
    complaint.priority = req.body.priority || req.body.finalPriority;
    complaint.priorityReviewedBy = req.user._id;
    complaint.priorityReviewedAt = new Date();
  }

  if (req.body.status === 'RESOLVED') complaint.resolvedAt = new Date();
  if (req.body.status === 'ASSIGNED' && req.body.assignedTo) complaint.status = 'ASSIGNED';

  const updated = await complaint.save();

  if (req.body.status && req.body.status !== previousStatus) {
    await createNotification({
      user: updated.submittedBy,
      title: 'Complaint status updated',
      message: `Your complaint "${updated.title}" is now ${updated.status}.`,
      type: 'COMPLAINT'
    });
  }

  const populated = await Complaint.findById(updated._id)
    .populate('aiAnalysis')
    .populate('assignedTo', 'name role')
    .populate('submittedBy', 'name role');
  res.json({ success: true, data: populated });
});

const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
  await complaint.deleteOne();
  res.json({ success: true, message: 'Complaint deleted.' });
});

const getComplaintAnalytics = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find().lean();
  if (!complaints.length) {
    return res.json({ success: true, empty: true, message: 'No data available', data: null });
  }

  const groupCount = (key) =>
    Object.entries(
      complaints.reduce((acc, item) => {
        const value = item[key] || 'UNKNOWN';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

  const resolved = complaints.filter((item) => item.status === 'RESOLVED' && item.resolvedAt);
  const avgResolutionHours = resolved.length
    ? Number(
        (
          resolved.reduce(
            (sum, item) => sum + (new Date(item.resolvedAt) - new Date(item.createdAt)) / 36e5,
            0
          ) / resolved.length
        ).toFixed(1)
      )
    : 0;

  const overTime = {};
  complaints.forEach((item) => {
    const day = new Date(item.createdAt).toISOString().slice(0, 10);
    overTime[day] = (overTime[day] || 0) + 1;
  });

  res.json({
    success: true,
    empty: false,
    data: {
      byCategory: groupCount('category'),
      byPriority: groupCount('finalPriority').length ? groupCount('finalPriority') : groupCount('priority'),
      byStatus: groupCount('status'),
      byDepartment: groupCount('department'),
      byLocation: groupCount('location'),
      resolvedVsPending: [
        { name: 'Resolved', value: complaints.filter((item) => item.status === 'RESOLVED').length },
        { name: 'Pending', value: complaints.filter((item) => item.status === 'PENDING').length },
        { name: 'In Progress', value: complaints.filter((item) => ['ASSIGNED', 'IN_PROGRESS'].includes(item.status)).length }
      ],
      averageResolutionHours: avgResolutionHours,
      requestsOverTime: Object.entries(overTime)
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([name, value]) => ({ name, value }))
    }
  });
});

module.exports = {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  getComplaintAnalytics
};
