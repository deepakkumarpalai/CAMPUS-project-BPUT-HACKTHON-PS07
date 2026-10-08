const Notice = require('../models/Notice');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { createNotification } = require('../services/notificationService');
const User = require('../models/User');
const { recordAudit } = require('../services/auditService');

const getNotices = asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }]
  };

  if (req.user.role !== 'ADMIN') {
    const audienceOptions = [{ targetAudience: 'ALL' }];
    if (req.user.role === 'STUDENT') audienceOptions.push({ targetAudience: 'STUDENTS' });
    if (req.user.role === 'FACULTY') audienceOptions.push({ targetAudience: 'FACULTY' });
    audienceOptions.push({ targetAudience: 'SPECIFIC_ROLE', targetRole: req.user.role });
    if (req.user.department) audienceOptions.push({ targetAudience: 'SPECIFIC_DEPARTMENT', department: req.user.department });
    if (req.user.role === 'STUDENT' && req.user.year) audienceOptions.push({ targetAudience: 'SPECIFIC_YEAR', targetYear: req.user.year });
    if (req.user.group) audienceOptions.push({ targetAudience: 'SPECIFIC_GROUP', targetGroup: req.user.group });
    filter.$and = [
      { $or: filter.$or },
      { $or: audienceOptions }
    ];
    delete filter.$or;
  }

  const notices = await Notice.find(filter).populate('createdBy', 'name role').sort({ createdAt: -1 });
  res.json({ success: true, count: notices.length, data: notices });
});

const getNoticeById = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id).populate('createdBy', 'name role');
  if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
  res.json({ success: true, data: notice });
});

const createNotice = asyncHandler(async (req, res) => {
  const { title, description, category, targetAudience, priority, department, targetRole, targetYear, targetGroup, expiresAt } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required.' });
  }
  const audience = targetAudience || 'ALL';
  if (!['ALL', 'STUDENTS', 'FACULTY', 'SPECIFIC_DEPARTMENT', 'SPECIFIC_ROLE', 'SPECIFIC_YEAR', 'SPECIFIC_GROUP'].includes(audience)) {
    return res.status(400).json({ success: false, message: 'Select a valid audience.' });
  }
  if (audience === 'SPECIFIC_ROLE' && !['STUDENT', 'FACULTY', 'ADMIN', 'SECURITY'].includes(targetRole)) {
    return res.status(400).json({ success: false, message: 'Choose a valid role to target.' });
  }
  if (audience === 'SPECIFIC_YEAR' && (!Number.isInteger(Number(targetYear)) || Number(targetYear) < 1 || Number(targetYear) > 6)) {
    return res.status(400).json({ success: false, message: 'Choose a student year between 1 and 6.' });
  }
  if (audience === 'SPECIFIC_DEPARTMENT' && !department?.trim()) {
    return res.status(400).json({ success: false, message: 'Enter a department to target.' });
  }
  if (audience === 'SPECIFIC_GROUP' && !targetGroup?.trim()) {
    return res.status(400).json({ success: false, message: 'Enter a group to target.' });
  }

  const notice = await Notice.create({
    title,
    description,
    category,
    targetAudience: audience,
    priority,
    department,
    targetRole: audience === 'SPECIFIC_ROLE' ? targetRole : undefined,
    targetYear: audience === 'SPECIFIC_YEAR' ? Number(targetYear) : undefined,
    targetGroup: audience === 'SPECIFIC_GROUP' ? targetGroup.trim() : undefined,
    expiresAt,
    createdBy: req.user._id
  });
  await recordAudit({ actor: req.user, action: 'NOTICE_PUBLISHED', entityType: 'NOTICE', entityId: notice._id, details: notice.targetAudience });

  const recipientFilter = {
    ALL: {},
    STUDENTS: { role: 'STUDENT' },
    FACULTY: { role: 'FACULTY' },
    SPECIFIC_DEPARTMENT: { department: notice.department },
    SPECIFIC_ROLE: { role: notice.targetRole },
    SPECIFIC_YEAR: { role: 'STUDENT', year: notice.targetYear },
    SPECIFIC_GROUP: { group: notice.targetGroup }
  }[notice.targetAudience];
  const users = await User.find(recipientFilter).select('_id');
  if (users.length) {
    await Promise.all(
      users.map((user) =>
        createNotification({
          user: user._id,
          title: 'New notice published',
          message: notice.title,
          type: 'NOTICE'
        })
      )
    );
  }

  res.status(201).json({ success: true, data: notice });
});

const updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
  Object.assign(notice, req.body);
  const updated = await notice.save();
  res.json({ success: true, data: updated });
});

const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ success: false, message: 'Notice not found.' });
  await notice.deleteOne();
  res.json({ success: true, message: 'Notice deleted.' });
});

module.exports = { getNotices, getNoticeById, createNotice, updateNotice, deleteNotice };
