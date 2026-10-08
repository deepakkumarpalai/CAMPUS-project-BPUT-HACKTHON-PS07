const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeComplaintPriority } = require('../services/complaintPriorityService');

const validPrediction = {
  category: 'Water Supply',
  severity: 'Critical',
  urgency: 'Very High',
  affectedPeople: 5,
  safetyImpact: 4,
  essentialServiceImpact: 5,
  priority: 'CRITICAL',
  priorityScore: 96,
  reason: 'Essential water service may affect multiple students.'
};

test('maps an AI microservice prediction into the existing complaint enum', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:8000/predict-priority');
    assert.deepEqual(JSON.parse(options.body), { complaint: 'No water in the hostel' });
    return { ok: true, json: async () => validPrediction };
  };

  try {
    const result = await analyzeComplaintPriority('No water in the hostel');
    assert.equal(result.categoryCode, 'WATER');
    assert.equal(result.analysisMode, 'ML_NLP');
    assert.equal(result.priorityScore, 96);
  } finally {
    global.fetch = originalFetch;
  }
});

test('rejects invalid model response data rather than storing a malformed prediction', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ ...validPrediction, priority: 'URGENT' })
  });

  try {
    await assert.rejects(
      analyzeComplaintPriority('A complaint with enough detail'),
      /invalid prediction/
    );
  } finally {
    global.fetch = originalFetch;
  }
});
