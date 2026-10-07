const express = require('express');
const {
  getCampusRequests,
  getCampusRequestById,
  createCampusRequest,
  updateCampusRequest
} = require('../controllers/campusRequestController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, getCampusRequests);
router.post('/', protect, authorizeRoles('STUDENT', 'FACULTY'), createCampusRequest);
router.get('/:id', protect, getCampusRequestById);
router.put('/:id', protect, authorizeRoles('ADMIN', 'FACULTY'), updateCampusRequest);

module.exports = router;
