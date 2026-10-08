const SLA_HOURS = { CRITICAL: 1, HIGH: 8, MEDIUM: 24, LOW: 72 };
const ESCALATION_REPEAT_MS = 24 * 60 * 60 * 1000;

const getSlaDeadline = (priority, createdAt = new Date()) => {
  const hours = SLA_HOURS[priority] || SLA_HOURS.MEDIUM;
  return new Date(new Date(createdAt).getTime() + hours * 60 * 60 * 1000);
};

const isEscalationDue = (complaint, now = new Date()) => {
  if (!complaint.dueAt || ['RESOLVED', 'REJECTED'].includes(complaint.status)) return false;
  if (new Date(complaint.dueAt) > now) return false;
  if (!complaint.lastEscalatedAt) return true;
  return now.getTime() - new Date(complaint.lastEscalatedAt).getTime() >= ESCALATION_REPEAT_MS;
};

module.exports = { SLA_HOURS, ESCALATION_REPEAT_MS, getSlaDeadline, isEscalationDue };