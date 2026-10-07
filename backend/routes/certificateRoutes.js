const express = require('express');
const {
  getCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate
} = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, getCertificates);
router.post('/', protect, authorizeRoles('STUDENT'), createCertificate);
router.get('/:id', protect, getCertificateById);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateCertificate);

module.exports = router;
