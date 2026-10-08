const AuditLog = require('../models/AuditLog');

const recordAudit = async ({ actor, action, entityType, entityId, details = '' }) => {
  try {
    return await AuditLog.create({
      actor: actor?._id || actor,
      action,
      entityType,
      entityId: String(entityId),
      details: typeof details === 'string' ? details : JSON.stringify(details)
    });
  } catch (error) {
    console.error('Audit log write failed:', error.message);
    return null;
  }
};

module.exports = { recordAudit };