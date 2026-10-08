const express = require('express');
const {
  createVisitorRequest,
  getVisitorStatus,
  listVisitorRequests,
  decideVisitorRequest,
  verifyVisitorQr
} = require('../controllers/visitorController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', createVisitorRequest);
router.get('/status/:referenceCode', getVisitorStatus);
router.get('/', protect, authorizeRoles('ADMIN', 'SECURITY'), listVisitorRequests);
router.patch('/:id/decision', protect, authorizeRoles('ADMIN'), decideVisitorRequest);
router.post('/verify', protect, authorizeRoles('SECURITY'), verifyVisitorQr);

module.exports = router;