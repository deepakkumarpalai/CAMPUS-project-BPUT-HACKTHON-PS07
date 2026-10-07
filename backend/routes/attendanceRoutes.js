const express = require('express');
const {
  getAttendance,
  getAttendanceSummary,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getStudentsForAttendance
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, getAttendance);
router.get('/summary', protect, getAttendanceSummary);
router.get('/students', protect, authorizeRoles('FACULTY', 'ADMIN'), getStudentsForAttendance);
router.post('/', protect, authorizeRoles('FACULTY', 'ADMIN'), createAttendance);
router.put('/:id', protect, authorizeRoles('FACULTY', 'ADMIN'), updateAttendance);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteAttendance);

module.exports = router;
