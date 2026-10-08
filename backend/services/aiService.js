const Complaint = require('../models/Complaint');
const CampusRequest = require('../models/CampusRequest');
const AIAnalysis = require('../models/AIAnalysis');

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'is', 'are', 'has',
  'have', 'been', 'since', 'many', 'with', 'from', 'this', 'that', 'not', 'working'
]);

const CATEGORY_RULES = [
  { category: 'SECURITY', keywords: ['fire', 'assault', 'threat', 'weapon', 'emergency', 'theft', 'security'] },
  { category: 'WATER', keywords: ['water', 'tap', 'pipeline', 'supply', 'leak'] },
  { category: 'ELECTRICAL', keywords: ['electric', 'electricity', 'power', 'light', 'fan', 'outage', 'projector'] },
  { category: 'IT', keywords: ['wifi', 'wi-fi', 'internet', 'network', 'computer', 'portal', 'login'] },
  { category: 'CLEANLINESS', keywords: ['clean', 'garbage', 'hygiene', 'sanitation', 'dirty', 'smell'] },
  { category: 'HOSTEL', keywords: ['hostel', 'warden', 'block'] },
  { category: 'MESS', keywords: ['mess', 'food', 'canteen', 'meal'] },
  { category: 'TRANSPORT', keywords: ['bus', 'transport', 'vehicle'] },
  { category: 'LIBRARY', keywords: ['library', 'book'] },
  { category: 'ACADEMIC', keywords: ['exam', 'class', 'faculty', 'marks', 'assignment', 'lecture'] },
  { category: 'ADMINISTRATION', keywords: ['fee', 'document', 'office', 'admin'] }
];

const SERVICE_CATEGORY_MAP = {
  WATER: 'Water',
  ELECTRICAL: 'Electrical',
  MAINTENANCE: 'Maintenance',
  CLEANLINESS: 'Cleaning',
  IT: 'IT Support',
  HOSTEL: 'Hostel',
  LIBRARY: 'Library',
  TRANSPORT: 'Transport',
  ACADEMIC: 'Classroom'
};

const extractKeywords = (text) => {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  return [...new Set(words)].slice(0, 8);
};

const tokenize = (text) =>
  new Set(
    (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  );

const jaccard = (a, b) => {
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  let intersection = 0;
  a.forEach((item) => {
    if (b.has(item)) intersection += 1;
  });
  return intersection / union.size;
};

const detectCategory = (text) => {
  const lower = (text || '').toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => lower.includes(keyword))) {
      return rule.category;
    }
  }
  return 'OTHER';
};

const detectDepartment = (category, text) => {
  const lower = (text || '').toLowerCase();
  if (lower.includes('hostel') || category === 'HOSTEL' || category === 'WATER') return 'HOSTEL_MAINTENANCE';
  if (category === 'ELECTRICAL') return 'ELECTRICAL_MAINTENANCE';
  if (category === 'IT') return 'IT_SUPPORT';
  if (category === 'SECURITY') return 'SECURITY';
  if (category === 'ACADEMIC') return 'ACADEMICS';
  if (category === 'TRANSPORT') return 'TRANSPORT';
  if (category === 'LIBRARY') return 'LIBRARY';
  if (category === 'MESS') return 'MESS';
  if (category === 'MAINTENANCE') return 'CAMPUS_MAINTENANCE';
  return 'GENERAL_ADMINISTRATION';
};

const detectPriority = (text, category) => {
  const lower = (text || '').toLowerCase();
  const criticalWords = ['fire', 'assault', 'weapon', 'collapse', 'explosion', 'life threatening'];
  const highWords = ['no water', 'water supply', 'power failure', 'electricity failure', 'outage', 'security', 'many students', 'entire', 'since morning'];
  const mediumWords = ['projector', 'wifi', 'internet', 'furniture', 'broken', 'classroom'];

  if (criticalWords.some((word) => lower.includes(word)) || category === 'SECURITY' && /fire|emergency|assault/.test(lower)) {
    return {
      priority: 'CRITICAL',
      reason: 'A safety or security emergency was detected. Administrators should review immediately.'
    };
  }
  if (highWords.some((word) => lower.includes(word)) || category === 'WATER') {
    return {
      priority: 'HIGH',
      reason: 'An essential campus service appears unavailable and multiple users may be affected.'
    };
  }
  if (mediumWords.some((word) => lower.includes(word))) {
    return {
      priority: 'MEDIUM',
      reason: 'A localized service or classroom issue that should be scheduled for resolution.'
    };
  }
  return {
    priority: 'LOW',
    reason: 'A minor maintenance issue or general request with limited immediate impact.'
  };
};

const findRelated = async (sourceType, title, description, excludeId) => {
  const Model = sourceType === 'COMPLAINT' ? Complaint : CampusRequest;
  const query = excludeId ? { _id: { $ne: excludeId } } : {};
  const items = await Model.find(query).select('title description').limit(50).lean();
  const currentTokens = tokenize(`${title} ${description}`);

  return items
    .map((item) => ({
      id: item._id,
      title: item.title,
      similarity: jaccard(currentTokens, tokenize(`${item.title} ${item.description}`))
    }))
    .filter((item) => item.similarity >= 0.35)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 3);
};

const ruleBasedAnalyze = async ({ sourceType, title, description, location }) => {
  const text = `${title} ${description} ${location || ''}`;
  const category = detectCategory(text);
  const { priority, reason } = detectPriority(text, category);
  const keywords = extractKeywords(text);
  const relatedItems = await findRelated(sourceType, title, description);
  const summary = description
    ? `${description.split('.')[0].slice(0, 160)}${description.length > 160 ? '.' : ''}`
    : title;

  return {
    analysisMode: 'RULE_BASED',
    category,
    priority,
    keywords,
    department: detectDepartment(category, text),
    summary,
    reason,
    possibleDuplicate: relatedItems.length > 0,
    relatedItems
  };
};

const callExternalAI = async ({ title, description, location }) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You assist campus administrators. Return JSON only with keys: category, priority, keywords, department, summary, reason. category must be one of ACADEMIC, HOSTEL, MESS, ELECTRICAL, WATER, CLEANLINESS, SECURITY, IT, TRANSPORT, LIBRARY, ADMINISTRATION, OTHER. priority must be LOW, MEDIUM, HIGH, or CRITICAL. Never approve, reject, or close a request.'
          },
          {
            role: 'user',
            content: `Title: ${title}\nLocation: ${location || 'N/A'}\nDescription: ${description}`
          }
        ]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content);
  } catch (_error) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const analyzeRequest = async ({ sourceType, sourceId, title, description, location }) => {
  const relatedItems = await findRelated(sourceType, title, description, sourceId);
  const aiResult = await callExternalAI({ title, description, location });

  let payload;
  if (aiResult && aiResult.category && aiResult.priority) {
    payload = {
      analysisMode: 'AI',
      category: aiResult.category,
      priority: aiResult.priority,
      keywords: Array.isArray(aiResult.keywords) ? aiResult.keywords.slice(0, 8) : extractKeywords(`${title} ${description}`),
      department: aiResult.department || detectDepartment(aiResult.category, `${title} ${description}`),
      summary: aiResult.summary || description.slice(0, 160),
      reason: aiResult.reason || 'AI recommendation for administrator review.',
      possibleDuplicate: relatedItems.length > 0,
      relatedItems
    };
  } else {
    payload = await ruleBasedAnalyze({ sourceType, title, description, location });
    payload.relatedItems = relatedItems;
    payload.possibleDuplicate = relatedItems.length > 0;
  }

  const analysis = await AIAnalysis.create({
    sourceType,
    sourceId,
    ...payload
  });

  return analysis;
};

const mapServiceCategory = (category) => SERVICE_CATEGORY_MAP[category] || 'Other';

module.exports = {
  analyzeRequest,
  mapServiceCategory,
  detectCategory,
  detectDepartment,
  detectPriority,
  detectCategory,
  detectPriority
};
