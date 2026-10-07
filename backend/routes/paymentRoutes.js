const express = require('express');
const {
  getFeeAccounts,
  createFeeAccount,
  createPaymentOrder,
  verifyPayment,
  cancelPaymentOrder,
  getPayments
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/fees', protect, authorizeRoles('STUDENT', 'ADMIN'), getFeeAccounts);
router.post('/fees', protect, authorizeRoles('ADMIN'), createFeeAccount);
router.post('/orders', protect, authorizeRoles('STUDENT'), createPaymentOrder);
router.post('/orders/:orderId/cancel', protect, authorizeRoles('STUDENT'), cancelPaymentOrder);
router.post('/verify', protect, authorizeRoles('STUDENT'), verifyPayment);
router.get('/', protect, authorizeRoles('STUDENT', 'ADMIN'), getPayments);

module.exports = router;
