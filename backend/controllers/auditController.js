const AuditLog = require('../models/AuditLog');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getAuditLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 50, 1), 100);
  const logs = await AuditLog.find()
    .populate('actor', 'name role email')
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ success: true, count: logs.length, data: logs });
});

module.exports = { getAuditLogs };