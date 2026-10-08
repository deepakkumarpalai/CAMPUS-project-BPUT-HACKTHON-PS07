const Complaint = require('../models/Complaint');
const AIAnalysis = require('../models/AIAnalysis');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { validateComplaint } = require('../validators/complaintValidator');
const { analyzeRequest, detectDepartment } = require('../services/aiService');
const { analyzeComplaintPriority } = require('../services/complaintPriorityService');
const { createNotification, notifyAdmins } = require('../services/notificationService');
const { getSlaDeadline } = require('../services/complaintSla');
const { recordAudit } = require('../services/auditService');
const { sortComplaintsByPriority } = require('../services/complaintPrioritySort');

const getComplaints = asyncHandler(async (req, res) => {
  const filter = {};
  const andFilters = [];
  if (req.user.role === 'STUDENT') filter.submittedBy = req.user._id;
  if (req.user.role === 'FACULTY' && req.query.mine === 'true') filter.submittedBy = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) {
    andFilters.push({
      $or: [{ finalPriority: req.query.priority }, { priority: req.query.priority }]
    });
  }
  if (req.query.category) filter.category = req.query.category;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.search) {
    andFilters.push({
      $or: [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { location: { $regex: req.query.search, $options: 'i' } }
      ]
    });
  }
  if (andFilters.length) filter.$and = andFilters;

  const complaints = await Complaint.find(filter)
    .populate('submittedBy', 'name role department studentId facultyId')
    .populate('assignedTo', 'name role')
    .populate('priorityReviewedBy', 'name')
    .populate('aiAnalysis')
    .populate('linkedComplaints', 'title status priority')
    .sort({ createdAt: -1 });

  const sorted = sortComplaintsByPriority(complaints);

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

  let analysis;
  try {
    analysis = await analyzeComplaintPriority(
      `${complaint.title}\n${complaint.description}\n${complaint.location || ''}`
    );
  } catch (error) {
    console.error('AI priority service unavailable; using existing complaint analysis.', error);
    analysis = await analyzeRequest({
      sourceType: 'COMPLAINT',
      sourceId: complaint._id,
      title: complaint.title,
      description: complaint.description,
      location: complaint.location
    });
  }

  if (analysis.analysisMode === 'ML_NLP') {
    const analysisRecord = await AIAnalysis.create({
      sourceType: 'COMPLAINT',
      sourceId: complaint._id,
      analysisMode: 'ML_NLP',
      category: analysis.categoryCode,
      priority: analysis.priority,
      severity: analysis.severity,
      urgency: analysis.urgency,
      affectedPeople: analysis.affectedPeople,
      safetyImpact: analysis.safetyImpact,
      essentialServiceImpact: analysis.essentialServiceImpact,
      priorityScore: analysis.priorityScore,
      reason: analysis.reason,
      summary: complaint.description.slice(0, 160),
      keywords: []
    });
    analysis = { ...analysis, _id: analysisRecord._id, department: '' };
  }

  const submittedCategory = req.body.category && req.body.category !== 'OTHER'
    ? req.body.category
    : null;
  complaint.category = submittedCategory || analysis.categoryCode || analysis.category || complaint.category;
  complaint.aiRecommendedPriority = analysis.priority;
  complaint.priority = analysis.priority;
  complaint.finalPriority = analysis.priority;
  complaint.prioritySource = 'AI';
  complaint.priorityScore = analysis.priorityScore;
  complaint.aiSeverity = analysis.severity;
  complaint.aiUrgency = analysis.urgency;
  complaint.affectedPeople = analysis.affectedPeople;
  complaint.safetyImpact = analysis.safetyImpact;
  complaint.essentialServiceImpact = analysis.essentialServiceImpact;
  complaint.dueAt = getSlaDeadline(analysis.priority, complaint.createdAt);
  complaint.priorityReason = analysis.reason;
  complaint.department = complaint.department || analysis.department || detectDepartment(
    analysis.categoryCode || analysis.category,
    `${complaint.title} ${complaint.description} ${complaint.location || ''}`
  );
  complaint.aiAnalysis = analysis._id;

  if (complaint.location.trim()) {
    const recurrenceWindow = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const previousMatches = await Complaint.countDocuments({
      _id: { $ne: complaint._id },
      category: complaint.category,
      location: complaint.location,
      createdAt: { $gte: recurrenceWindow }
    });
    complaint.recurrenceCount = previousMatches + 1;
    complaint.isRecurring = complaint.recurrenceCount >= 3;
  }
  await complaint.save();

  await notifyAdmins({
    title: 'New complaint submitted',
    message: `${complaint.title} (${analysis.analysisMode === 'ML_NLP' ? 'AI-assisted NLP recommendation' : analysis.analysisMode === 'AI' ? 'AI Analysis' : 'Rule-Based Analysis'})`,
    type: 'COMPLAINT'
  });
  if (complaint.isRecurring) {
    await notifyAdmins({
      title: 'Recurring campus issue detected',
      message: `${complaint.recurrenceCount} ${complaint.category} reports were submitted at ${complaint.location} within 14 days. Consider a permanent fix.`,
      type: 'COMPLAINT'
    });
  }

  const populated = await Complaint.findById(complaint._id).populate('aiAnalysis');
  res.status(201).json({ success: true, data: populated });
});

const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  if (req.user.role === 'STUDENT') {
    return res.status(403).json({ success: false, message: 'Students cannot update complaint workflow fields.' });
  }

  const priorityWasSubmitted = req.body.finalPriority !== undefined || req.body.priority !== undefined;
  if (priorityWasSubmitted && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Only administrators can override AI priority.' });
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
    complaint.prioritySource = 'ADMIN';
    complaint.priorityReviewedBy = req.user._id;
    complaint.priorityReviewedAt = new Date();
    complaint.dueAt = getSlaDeadline(complaint.finalPriority, complaint.createdAt);
  }

  if (req.body.status === 'RESOLVED') complaint.resolvedAt = new Date();
  else if (req.body.status && req.body.status !== 'RESOLVED') complaint.resolvedAt = undefined;
  if (req.body.status === 'ASSIGNED' && req.body.assignedTo) complaint.status = 'ASSIGNED';

  const updated = await complaint.save();
  await recordAudit({
    actor: req.user,
    action: 'COMPLAINT_REVIEWED',
    entityType: 'COMPLAINT',
    entityId: updated._id,
    details: { status: updated.status, priority: updated.finalPriority || updated.priority, assignedTo: updated.assignedTo || '' }
  });

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
  const recurrenceWindow = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recurringGroups = {};
  complaints.forEach((item) => {
    const day = new Date(item.createdAt).toISOString().slice(0, 10);
    overTime[day] = (overTime[day] || 0) + 1;
    if (item.location && new Date(item.createdAt) >= recurrenceWindow) {
      const key = `${item.category}::${item.location}`;
      recurringGroups[key] = (recurringGroups[key] || 0) + 1;
    }
  });

  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const previousWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thisWeek = complaints.filter((item) => new Date(item.createdAt) >= weekStart);
  const previousWeek = complaints.filter((item) => {
    const createdAt = new Date(item.createdAt);
    return createdAt >= previousWeekStart && createdAt < weekStart;
  });
  const locationCounts = {};
  thisWeek.forEach((item) => {
    if (item.location) locationCounts[item.location] = (locationCounts[item.location] || 0) + 1;
  });
  const busiestLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0];
  const overdueOpenComplaints = complaints.filter((item) =>
    item.dueAt && new Date(item.dueAt) < now && !['RESOLVED', 'REJECTED'].includes(item.status)
  ).length;
  const recurringIssues = Object.entries(recurringGroups)
    .filter(([, count]) => count >= 3)
    .map(([key, count]) => {
      const [category, location] = key.split('::');
      return { category, location, count };
    })
    .sort((a, b) => b.count - a.count);

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
      overdueOpenComplaints,
      recurringIssues,
      complaintsThisWeek: thisWeek.length,
      complaintsPreviousWeek: previousWeek.length,
      weeklyChangePercent: previousWeek.length
        ? Math.round(((thisWeek.length - previousWeek.length) / previousWeek.length) * 100)
        : null,
      busiestLocationThisWeek: busiestLocation ? { location: busiestLocation[0], count: busiestLocation[1] } : null,
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
