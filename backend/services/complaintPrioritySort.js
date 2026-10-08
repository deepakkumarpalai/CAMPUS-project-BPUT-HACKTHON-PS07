const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const sortComplaintsByPriority = (complaints) =>
  [...complaints].sort((a, b) => {
    const priorityA = PRIORITY_ORDER[a.finalPriority || a.priority] ?? 9;
    const priorityB = PRIORITY_ORDER[b.finalPriority || b.priority] ?? 9;
    if (priorityA !== priorityB) return priorityA - priorityB;

    const scoreDifference = (b.priorityScore || 0) - (a.priorityScore || 0);
    if (scoreDifference !== 0) return scoreDifference;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

module.exports = { sortComplaintsByPriority };
