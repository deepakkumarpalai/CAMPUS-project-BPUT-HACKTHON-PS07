const crypto = require('crypto');
const FeeAccount = require('../models/FeeAccount');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');

const getRazorpayKeys = () => {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    const error = new Error('Razorpay is not configured. Add test keys to backend/.env.');
    error.statusCode = 503;
    throw error;
  }
  if (!RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    const error = new Error('Only Razorpay test keys are allowed for this hackathon setup.');
    error.statusCode = 503;
    throw error;
  }
  return { keyId: RAZORPAY_KEY_ID, keySecret: RAZORPAY_KEY_SECRET };
};

const razorpayRequest = async (path, options = {}) => {
  const { keyId, keySecret } = getRazorpayKeys();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error?.description || 'Razorpay request failed.');
    error.statusCode = response.status >= 500 ? 502 : 400;
    throw error;
  }
  return result;
};

const getFeeAccounts = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'ADMIN' ? {} : { user: req.user._id };
  const accounts = await FeeAccount.find(filter)
    .populate('user', 'name email studentId')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: accounts.length, data: accounts });
});

const createFeeAccount = asyncHandler(async (req, res) => {
  const { studentId, courseName, academicYear, totalFee, dueDate } = req.body;
  const feeRupees = Number(totalFee);
  const totalFeePaise = Math.round(feeRupees * 100);
  if (!studentId || !courseName || !academicYear || !Number.isFinite(feeRupees) || !Number.isSafeInteger(totalFeePaise) || feeRupees <= 0) {
    return res.status(400).json({ success: false, message: 'Student, course, academic year, and a positive total fee are required.' });
  }
  const student = await User.findOne({ _id: studentId, role: 'STUDENT' }).select('_id');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
  const current = await FeeAccount.findOne({
    user: student._id,
    courseName: courseName.trim(),
    academicYear: academicYear.trim()
  });
  if (current?.pendingPaymentExpiresAt > new Date()) {
    return res.status(409).json({ success: false, message: 'This fee has a payment checkout in progress. Try again after it expires.' });
  }
  if (current && totalFeePaise < current.paidFeePaise) {
    return res.status(400).json({ success: false, message: 'Total fee cannot be lower than the amount already paid.' });
  }

  const feeAccount = await FeeAccount.findOneAndUpdate(
    { user: student._id, courseName: courseName.trim(), academicYear: academicYear.trim() },
    {
      $set: {
        totalFeePaise,
        dueDate: dueDate || null,
        setBy: req.user._id
      },
      $setOnInsert: { user: student._id, courseName: courseName.trim(), academicYear: academicYear.trim() }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('user', 'name email studentId');
  res.status(201).json({ success: true, data: feeAccount });
});

const createPaymentOrder = asyncHandler(async (req, res) => {
  const { feeAccountId } = req.body;
  const feeAccount = await FeeAccount.findOne({ _id: feeAccountId, user: req.user._id });
  if (!feeAccount) return res.status(404).json({ success: false, message: 'Fee account not found.' });
  const duePaise = feeAccount.totalFeePaise - feeAccount.paidFeePaise;
  if (duePaise <= 0) return res.status(400).json({ success: false, message: 'This course fee is already paid.' });

  const now = new Date();
  if (feeAccount.pendingPaymentExpiresAt > now) {
    return res.status(409).json({ success: false, message: 'A payment checkout is already in progress for this fee.' });
  }

  const receipt = `fee_${crypto.randomUUID().replace(/-/g, '').slice(0, 32)}`;
  const reservation = await FeeAccount.findOneAndUpdate(
    {
      _id: feeAccount._id,
      paidFeePaise: { $lt: feeAccount.totalFeePaise },
      $or: [{ pendingPaymentExpiresAt: null }, { pendingPaymentExpiresAt: { $lte: now } }]
    },
    {
      $set: {
        pendingPaymentReceipt: receipt,
        pendingPaymentExpiresAt: new Date(now.getTime() + 30 * 60 * 1000),
        pendingOrderId: null
      }
    },
    { new: true }
  );
  if (!reservation) {
    return res.status(409).json({ success: false, message: 'A payment checkout is already in progress for this fee.' });
  }

  try {
    const { keyId } = getRazorpayKeys();
    const order = await razorpayRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: duePaise,
        currency: feeAccount.currency,
        receipt,
        expire_by: Math.floor(now.getTime() / 1000) + 1800,
        notes: { feeAccountId: feeAccount._id.toString(), userId: req.user._id.toString() }
      })
    });
    await Payment.create({
      user: req.user._id,
      feeAccount: feeAccount._id,
      orderId: order.id,
      amountPaise: duePaise,
      currency: feeAccount.currency
    });
    await FeeAccount.updateOne(
      { _id: feeAccount._id, pendingPaymentReceipt: receipt },
      { $set: { pendingOrderId: order.id } }
    );
    res.status(201).json({
      success: true,
      data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId, name: req.user.name }
    });
  } catch (error) {
    await FeeAccount.updateOne(
      { _id: feeAccount._id, pendingPaymentReceipt: receipt },
      { $set: { pendingPaymentReceipt: null, pendingPaymentExpiresAt: null, pendingOrderId: null } }
    );
    throw error;
  }
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ success: false, message: 'Razorpay payment verification details are incomplete.' });
  }
  const payment = await Payment.findOne({ orderId, user: req.user._id });
  if (!payment) return res.status(404).json({ success: false, message: 'Payment order not found.' });
  if (payment.status === 'PAID' && payment.paymentId === paymentId) {
    return res.json({ success: true, data: payment });
  }
  if (payment.status !== 'PENDING') {
    return res.status(409).json({ success: false, message: 'This payment order is no longer active.' });
  }

  const { keySecret } = getRazorpayKeys();
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  let providedSignature;
  try {
    providedSignature = Buffer.from(signature, 'hex');
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
  }
  if (providedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(providedSignature, expectedSignature)) {
    return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
  }

  const gatewayPayment = await razorpayRequest(`/payments/${encodeURIComponent(paymentId)}`);
  if (
    gatewayPayment.order_id !== orderId ||
    gatewayPayment.amount !== payment.amountPaise ||
    gatewayPayment.currency !== payment.currency ||
    gatewayPayment.status !== 'captured'
  ) {
    return res.status(400).json({ success: false, message: 'The gateway payment is not captured or does not match this fee.' });
  }

  const session = await Payment.startSession();
  try {
    let updatedPayment;
    await session.withTransaction(async () => {
      const feeAccount = await FeeAccount.findOneAndUpdate(
        {
          _id: payment.feeAccount,
          user: req.user._id,
          pendingOrderId: orderId,
          $expr: { $lte: [{ $add: ['$paidFeePaise', payment.amountPaise] }, '$totalFeePaise'] }
        },
        {
          $inc: { paidFeePaise: payment.amountPaise },
          $set: { pendingPaymentReceipt: null, pendingPaymentExpiresAt: null, pendingOrderId: null }
        },
        { new: true, session }
      );
      if (!feeAccount) {
        const error = new Error('The fee balance changed before this payment could be applied. Contact the campus administrator.');
        error.statusCode = 409;
        throw error;
      }
      updatedPayment = await Payment.findOneAndUpdate(
        { _id: payment._id, status: 'PENDING' },
        {
          $set: {
            status: 'PAID',
            paymentId,
            method: gatewayPayment.method || '',
            paidAt: new Date()
          }
        },
        { new: true, session }
      );
      if (!updatedPayment) {
        const error = new Error('This payment has already been processed.');
        error.statusCode = 409;
        throw error;
      }
    });
    res.json({ success: true, data: updatedPayment });
  } finally {
    await session.endSession();
  }
});

const cancelPaymentOrder = asyncHandler(async (req, res) => {
  const payment = await Payment.findOneAndUpdate(
    { orderId: req.params.orderId, user: req.user._id, status: 'PENDING' },
    { $set: { status: 'EXPIRED' } },
    { new: true }
  );
  if (payment) {
    await FeeAccount.updateOne(
      { _id: payment.feeAccount, user: req.user._id, pendingOrderId: payment.orderId },
      { $set: { pendingPaymentReceipt: null, pendingPaymentExpiresAt: null, pendingOrderId: null } }
    );
  }
  res.json({ success: true, message: 'Payment checkout closed.' });
});

const getPayments = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'ADMIN' ? {} : { user: req.user._id };
  const payments = await Payment.find(filter)
    .populate('user', 'name email studentId')
    .populate('feeAccount', 'courseName academicYear')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: payments.length, data: payments });
});

module.exports = { getFeeAccounts, createFeeAccount, createPaymentOrder, verifyPayment, cancelPaymentOrder, getPayments };
