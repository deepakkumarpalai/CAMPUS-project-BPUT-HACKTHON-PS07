const test = require('node:test');
const assert = require('node:assert/strict');
const { sortComplaintsByPriority } = require('../services/complaintPrioritySort');

test('sorts complaints by priority, score, then oldest creation time', () => {
  const complaints = [
    { title: 'low', priority: 'LOW', priorityScore: 20, createdAt: '2026-01-01T00:00:00Z' },
    { title: 'critical lower score', priority: 'CRITICAL', priorityScore: 85, createdAt: '2026-01-01T00:00:00Z' },
    { title: 'high', priority: 'HIGH', priorityScore: 80, createdAt: '2026-01-01T00:00:00Z' },
    { title: 'critical higher score', priority: 'CRITICAL', priorityScore: 95, createdAt: '2026-01-02T00:00:00Z' },
    { title: 'medium older tie', priority: 'MEDIUM', priorityScore: 52, createdAt: '2026-01-01T00:00:00Z' },
    { title: 'medium newer tie', priority: 'MEDIUM', priorityScore: 52, createdAt: '2026-01-02T00:00:00Z' }
  ];

  const sorted = sortComplaintsByPriority(complaints);
  assert.deepEqual(
    sorted.map((complaint) => complaint.title),
    ['critical higher score', 'critical lower score', 'high', 'medium older tie', 'medium newer tie', 'low']
  );
  assert.equal(complaints[0].title, 'low', 'sort should not mutate the caller array');
});
