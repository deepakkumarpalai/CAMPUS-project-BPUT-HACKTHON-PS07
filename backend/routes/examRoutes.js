const express = require('express');
const { getExams, createExam, updateExam, setExamResult, deleteExam } = require('../controllers/examController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, getExams);
router.post('/', protect, authorizeRoles('ADMIN'), createExam);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateExam);
router.put('/:id/results', protect, authorizeRoles('ADMIN'), setExamResult);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteExam);

module.exports = router;
