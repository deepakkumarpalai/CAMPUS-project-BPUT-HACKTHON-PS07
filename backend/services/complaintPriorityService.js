const CATEGORY_MAP = {
  'Water Supply': 'WATER',
  Electrical: 'ELECTRICAL',
  Hostel: 'HOSTEL',
  'Mess & Food': 'MESS',
  'Wi-Fi & Internet': 'IT',
  'Bathroom & Cleaning': 'CLEANLINESS',
  Security: 'SECURITY',
  'Gate Pass': 'ADMINISTRATION',
  'Classroom & Laboratory': 'ACADEMIC',
  Transport: 'TRANSPORT',
  Maintenance: 'MAINTENANCE',
  Library: 'LIBRARY',
  Academic: 'ACADEMIC',
  Administration: 'ADMINISTRATION'
};

const PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const SEVERITIES = new Set(['Low', 'Medium', 'High', 'Critical']);
const URGENCIES = new Set(['Low', 'Medium', 'High', 'Very High']);

const analyzeComplaintPriority = async (complaint) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const baseUrl = (process.env.AI_PRIORITY_SERVICE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

  try {
    const response = await fetch(`${baseUrl}/predict-priority`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ complaint })
    });
    if (!response.ok) {
      throw new Error(`AI priority service returned HTTP ${response.status}.`);
    }

    const result = await response.json();
    if (
      !result ||
      typeof result !== 'object' ||
      !CATEGORY_MAP[result.category] ||
      !SEVERITIES.has(result.severity) ||
      !URGENCIES.has(result.urgency) ||
      !PRIORITIES.has(result.priority) ||
      !Number.isInteger(result.priorityScore) ||
      result.priorityScore < 0 ||
      result.priorityScore > 100 ||
      !Number.isInteger(result.affectedPeople) ||
      result.affectedPeople < 1 ||
      typeof result.reason !== 'string' ||
      !result.reason.trim()
    ) {
      throw new Error('AI priority service returned an invalid prediction.');
    }

    return {
      ...result,
      categoryCode: CATEGORY_MAP[result.category],
      analysisMode: 'ML_NLP'
    };
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = { analyzeComplaintPriority };
