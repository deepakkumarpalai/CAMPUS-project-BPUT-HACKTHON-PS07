const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async ({ user, title, message, type = 'SYSTEM' }) => {
  if (!user) return null;
  return Notification.create({ user, title, message, type });
};

const notifyAdmins = async ({ title, message, type = 'SYSTEM' }) => {
  const admins = await User.find({ role: 'ADMIN' }).select('_id');
  await Promise.all(
    admins.map((admin) =>
      Notification.create({ user: admin._id, title, message, type })
    )
  );
};

const notifyRole = async ({ role, title, message, type = 'SYSTEM' }) => {
  const users = await User.find({ role }).select('_id');
  await Promise.all(
    users.map((item) => Notification.create({ user: item._id, title, message, type }))
  );
};

module.exports = { createNotification, notifyAdmins, notifyRole };
