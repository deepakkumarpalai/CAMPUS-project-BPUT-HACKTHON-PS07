const Notice = require('../models/Notice');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { notifyRole, createNotification } = require('../services/notificationService');
const User = require('../models/User');

const getNotices = asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = {
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }]
  };

  if (req.user.role === 'STUDENT') {
    filter.$and = [
      {
        $or: [
          { targetAudience: 'ALL' },
          { targetAudience: 'STUDENTS' },
          { targetAudience: 'SPECIFIC_DEPARTMENT', department: req.user.department }
        ]
      }
    ];
  } else if (req.user.role === 'FACULTY') {
    filter.$and = [
      {
        $or: [
          { targetAudience: 'ALL' },
          { targetAudience: 'FACULTY' },
          { targetAudience: 'SPECIFIC_DEPARTMENT', department: req.user.department }
        ]
      }
    ];
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
  const { title, description, category, targetAudience, priority, department, expiresAt } = req.body;
  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Title and description are required.' });
  }

  const notice = await Notice.create({
    title,
    description,
    category,
    targetAudience: targetAudience || 'ALL',
    priority,
    department,
    expiresAt,
    createdBy: req.user._id
  });

  if (notice.targetAudience === 'STUDENTS' || notice.targetAudience === 'ALL') {
    await notifyRole({
      role: 'STUDENT',
      title: 'New notice published',
      message: notice.title,
      type: 'NOTICE'
    });
  }
  if (notice.targetAudience === 'FACULTY' || notice.targetAudience === 'ALL') {
    await notifyRole({
      role: 'FACULTY',
      title: 'New notice published',
      message: notice.title,
      type: 'NOTICE'
    });
  }
  if (notice.targetAudience === 'SPECIFIC_DEPARTMENT' && notice.department) {
    const users = await User.find({ department: notice.department }).select('_id');
    await Promise.all(
      users.map((user) =>
        createNotification({
          user: user._id,
          title: 'Department notice published',
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
