const express = require('express');
const {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  deleteNotice
} = require('../controllers/noticeController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, getNotices);
router.post('/', protect, authorizeRoles('ADMIN'), createNotice);
router.get('/:id', protect, getNoticeById);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateNotice);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteNotice);

module.exports = router;
