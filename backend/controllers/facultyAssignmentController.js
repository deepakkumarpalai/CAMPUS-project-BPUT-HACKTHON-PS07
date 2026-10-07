const FacultyAssignment = require('../models/FacultyAssignment');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getFacultyAssignments = asyncHandler(async (_req, res) => {
  const assignments = await FacultyAssignment.find().sort({ semester: 1, branch: 1, section: 1, subject: 1 });
  res.json({ success: true, count: assignments.length, data: assignments });
});

module.exports = { getFacultyAssignments };
