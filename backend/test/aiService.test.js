const test = require('node:test');
const assert = require('node:assert/strict');
const { detectCategory, detectDepartment, detectPriority } = require('../services/aiService');

test('classifies a classroom projector fault as electrical maintenance, not hostel', () => {
  const report = 'The projector in Room 204 is not working before lectures.';
  const category = detectCategory(report);
  assert.equal(category, 'ELECTRICAL');
  assert.equal(detectDepartment(category, report), 'ELECTRICAL_MAINTENANCE');
  assert.equal(detectPriority(report, category).priority, 'MEDIUM');
});

test('classifies explicit hostel complaints as hostel issues', () => {
  assert.equal(detectCategory('The room in Hostel Block B needs repair.'), 'HOSTEL');
});