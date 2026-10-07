const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  const unread = notifications.filter((item) => !item.isRead).length;
  res.json({ success: true, count: notifications.length, unread, data: notifications });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, unread });
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
  notification.isRead = true;
  await notification.save();
  res.json({ success: true, data: notification });
});

const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
});

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };
