const express = require('express');
const {
  getProblems,
  createProblem,
  updateProblem,
  deleteProblem
} = require('../controllers/campusProblemController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, getProblems);
router.post('/', protect, authorizeRoles('STUDENT', 'FACULTY'), createProblem);
router.put('/:id', protect, authorizeRoles('STUDENT', 'FACULTY', 'ADMIN'), updateProblem);
router.delete('/:id', protect, authorizeRoles('STUDENT', 'FACULTY', 'ADMIN'), deleteProblem);

module.exports = router;
