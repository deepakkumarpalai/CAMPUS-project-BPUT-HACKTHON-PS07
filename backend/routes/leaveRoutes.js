const express = require('express');
const {
  getLeaveRequests,
  getLeaveById,
  createLeaveRequest,
  updateLeaveRequest
} = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', protect, getLeaveRequests);
router.post('/', protect, authorizeRoles('STUDENT'), upload.single('attachment'), createLeaveRequest);
router.get('/:id', protect, getLeaveById);
router.put('/:id', protect, updateLeaveRequest);

module.exports = router;
