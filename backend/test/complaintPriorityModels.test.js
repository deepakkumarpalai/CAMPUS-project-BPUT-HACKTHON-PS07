const test = require('node:test');
const assert = require('node:assert/strict');
const Complaint = require('../models/Complaint');
const AIAnalysis = require('../models/AIAnalysis');

test('supports persisted NLP recommendation fields and administrator override source', () => {
  const submittedBy = new Complaint()._id;
  const complaint = new Complaint({
    title: 'Water outage in the residence',
    description: 'There is no water in the entire hostel since morning.',
    category: 'WATER',
    priority: 'CRITICAL',
    aiRecommendedPriority: 'CRITICAL',
    finalPriority: 'HIGH',
    prioritySource: 'ADMIN',
    priorityScore: 95,
    aiSeverity: 'Critical',
    aiUrgency: 'Very High',
    affectedPeople: 5,
    safetyImpact: 4,
    essentialServiceImpact: 5,
    submittedBy
  });

  assert.equal(complaint.validateSync(), undefined);
  assert.equal(complaint.prioritySource, 'ADMIN');
});

test('accepts Maintenance category and ML_NLP explanation records', () => {
  const analysis = new AIAnalysis({
    sourceType: 'COMPLAINT',
    sourceId: new Complaint()._id,
    analysisMode: 'ML_NLP',
    category: 'MAINTENANCE',
    priority: 'LOW',
    severity: 'Low',
    urgency: 'Low',
    affectedPeople: 1,
    safetyImpact: 1,
    essentialServiceImpact: 1,
    priorityScore: 25,
    reason: 'A localized maintenance issue.'
  });

  assert.equal(analysis.validateSync(), undefined);
});
