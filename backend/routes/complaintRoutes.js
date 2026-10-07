const express = require('express');
const {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  getComplaintAnalytics
} = require('../controllers/complaintController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/', protect, getComplaints);
router.get('/analytics/summary', protect, authorizeRoles('ADMIN'), getComplaintAnalytics);
router.post('/', protect, authorizeRoles('STUDENT', 'FACULTY'), upload.array('attachments', 5), createComplaint);
router.get('/:id', protect, getComplaintById);
router.put('/:id', protect, authorizeRoles('ADMIN', 'FACULTY'), updateComplaint);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteComplaint);

module.exports = router;
