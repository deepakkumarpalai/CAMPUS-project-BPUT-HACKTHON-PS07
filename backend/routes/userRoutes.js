const express = require('express');
const {
  getUsers,
  createSecurityUser,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats
} = require('../controllers/userController');
const { setStudentDateOfBirth } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/stats/dashboard', protect, authorizeRoles('ADMIN'), getDashboardStats);
router.post('/security', protect, authorizeRoles('ADMIN'), createSecurityUser);
router.get('/', protect, authorizeRoles('ADMIN', 'FACULTY'), getUsers);
router.put('/:id/student-dob', protect, authorizeRoles('ADMIN'), setStudentDateOfBirth);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUser);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteUser);

module.exports = router;
