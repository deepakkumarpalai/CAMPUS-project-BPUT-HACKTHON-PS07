const test = require('node:test');
const assert = require('node:assert/strict');
const { getSlaDeadline, isEscalationDue } = require('../services/complaintSla');

test('assigns shorter SLA deadlines to higher priorities', () => {
  const createdAt = new Date('2026-10-08T00:00:00.000Z');
  assert.equal(getSlaDeadline('CRITICAL', createdAt).toISOString(), '2026-10-08T01:00:00.000Z');
  assert.equal(getSlaDeadline('HIGH', createdAt).toISOString(), '2026-10-08T08:00:00.000Z');
  assert.equal(getSlaDeadline('MEDIUM', createdAt).toISOString(), '2026-10-09T00:00:00.000Z');
  assert.equal(getSlaDeadline('LOW', createdAt).toISOString(), '2026-10-11T00:00:00.000Z');
});

test('escalates overdue open complaints once per day', () => {
  const now = new Date('2026-10-08T12:00:00.000Z');
  const complaint = { status: 'IN_PROGRESS', dueAt: '2026-10-08T10:00:00.000Z' };
  assert.equal(isEscalationDue(complaint, now), true);
  assert.equal(isEscalationDue({ ...complaint, lastEscalatedAt: '2026-10-08T11:00:00.000Z' }, now), false);
  assert.equal(isEscalationDue({ ...complaint, lastEscalatedAt: '2026-10-07T11:00:00.000Z' }, now), true);
});

test('does not escalate unresolved deadlines or closed complaints', () => {
  const now = new Date('2026-10-08T12:00:00.000Z');
  assert.equal(isEscalationDue({ status: 'PENDING', dueAt: '2026-10-08T13:00:00.000Z' }, now), false);
  assert.equal(isEscalationDue({ status: 'RESOLVED', dueAt: '2026-10-08T10:00:00.000Z' }, now), false);
  assert.equal(isEscalationDue({ status: 'REJECTED', dueAt: '2026-10-08T10:00:00.000Z' }, now), false);
});