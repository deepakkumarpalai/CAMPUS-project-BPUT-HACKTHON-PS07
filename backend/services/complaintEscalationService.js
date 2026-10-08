const Complaint = require('../models/Complaint');
const { createNotification, notifyAdmins } = require('./notificationService');
const { isEscalationDue } = require('./complaintSla');

const runComplaintEscalations = async (now = new Date()) => {
  const candidates = await Complaint.find({
    status: { $nin: ['RESOLVED', 'REJECTED'] },
    dueAt: { $lte: now },
    $or: [
      { lastEscalatedAt: { $exists: false } },
      { lastEscalatedAt: null },
      { lastEscalatedAt: { $lte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
    ]
  }).select('title status dueAt lastEscalatedAt assignedTo escalationCount');

  let escalated = 0;
  for (const complaint of candidates) {
    if (!isEscalationDue(complaint, now)) continue;
    const updated = await Complaint.findOneAndUpdate(
      {
        _id: complaint._id,
        status: { $nin: ['RESOLVED', 'REJECTED'] },
        lastEscalatedAt: complaint.lastEscalatedAt || null
      },
      { $set: { lastEscalatedAt: now }, $inc: { escalationCount: 1 } },
      { new: true }
    );
    if (!updated) continue;

    const message = `SLA overdue: "${complaint.title}" is still ${complaint.status}. Please review and update it.`;
    await notifyAdmins({ title: 'Complaint SLA escalation', message, type: 'COMPLAINT' });
    await createNotification({ user: complaint.assignedTo, title: 'Assigned complaint is overdue', message, type: 'COMPLAINT' });
    escalated += 1;
  }
  return escalated;
};

const startComplaintEscalationScheduler = () => {
  const run = () => runComplaintEscalations().catch((error) => {
    console.error('Complaint SLA escalation failed:', error.message);
  });
  const timer = setInterval(run, 5 * 60 * 1000);
  timer.unref();
  run();
};

module.exports = { runComplaintEscalations, startComplaintEscalationScheduler };