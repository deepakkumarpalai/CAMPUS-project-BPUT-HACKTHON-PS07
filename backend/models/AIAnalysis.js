const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema(
  {
    sourceType: { type: String, enum: ['COMPLAINT', 'CAMPUS_REQUEST'], required: true },
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    analysisMode: { type: String, enum: ['AI', 'RULE_BASED', 'ML_NLP'], required: true },
    category: { type: String },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'] },
    urgency: { type: String, enum: ['Low', 'Medium', 'High', 'Very High'] },
    affectedPeople: { type: Number, min: 1 },
    safetyImpact: { type: Number, min: 1, max: 5 },
    essentialServiceImpact: { type: Number, min: 1, max: 5 },
    priorityScore: { type: Number, min: 0, max: 100 },
    keywords: [{ type: String }],
    department: { type: String },
    summary: { type: String },
    reason: { type: String },
    possibleDuplicate: { type: Boolean, default: false },
    relatedItems: [
      {
        id: { type: mongoose.Schema.Types.ObjectId },
        title: String,
        similarity: Number
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
