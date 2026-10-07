const CampusProblem = require('../models/CampusProblem');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getProblems = asyncHandler(async (_req, res) => {
  const problems = await CampusProblem.find()
    .populate('createdBy', 'name role department')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: problems.length, data: problems });
});

const createProblem = asyncHandler(async (req, res) => {
  const { title, description, category, contactPhone } = req.body;
  if (!title || !description || !contactPhone) {
    return res.status(400).json({ success: false, message: 'Title, description, and contact phone are required.' });
  }
  const problem = await CampusProblem.create({
    title,
    description,
    category: category || 'GENERAL',
    contactPhone,
    createdBy: req.user._id
  });
  await problem.populate('createdBy', 'name role department');
  res.status(201).json({ success: true, data: problem });
});

const updateProblem = asyncHandler(async (req, res) => {
  const problem = await CampusProblem.findById(req.params.id);
  if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });
  if (req.user.role !== 'ADMIN' && problem.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only update a problem you posted.' });
  }
  ['title', 'description', 'category', 'contactPhone', 'status'].forEach((field) => {
    if (req.body[field] !== undefined) problem[field] = req.body[field];
  });
  await problem.save();
  res.json({ success: true, data: problem });
});

const deleteProblem = asyncHandler(async (req, res) => {
  const problem = await CampusProblem.findById(req.params.id);
  if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });
  if (req.user.role !== 'ADMIN' && problem.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You can only delete a problem you posted.' });
  }
  await problem.deleteOne();
  res.json({ success: true, message: 'Problem deleted.' });
});

module.exports = { getProblems, createProblem, updateProblem, deleteProblem };
