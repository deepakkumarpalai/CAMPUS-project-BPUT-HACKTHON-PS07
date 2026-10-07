const express = require('express');
const {
  getGatePasses,
  getGatePassById,
  createGatePass,
  updateGatePass
} = require('../controllers/gatePassController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, getGatePasses);
router.post('/', protect, authorizeRoles('STUDENT'), createGatePass);
router.get('/:id', protect, getGatePassById);
router.put('/:id', protect, authorizeRoles('ADMIN', 'FACULTY'), updateGatePass);

module.exports = router;
