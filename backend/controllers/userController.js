const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { sanitizeUser } = require('./authController');

const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { studentId: { $regex: req.query.search, $options: 'i' } },
      { facultyId: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users.map(sanitizeUser) });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, data: sanitizeUser(user) });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const isOwner = req.user._id.toString() === user._id.toString();
  if (!isOwner && req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'You can only update your own profile.' });
  }

  const allowed = ['name', 'phone', 'department', 'studentId', 'facultyId', 'profileImage', 'courses'];
  if (req.user.role === 'ADMIN') allowed.push('role');

  allowed.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  if (req.body.password) {
    user.password = req.body.password;
  }

  const updated = await user.save();
  res.json({ success: true, data: sanitizeUser(updated) });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted.' });
});

const getDashboardStats = asyncHandler(async (req, res) => {
  const Complaint = require('../models/Complaint');
  const LeaveRequest = require('../models/LeaveRequest');
  const CertificateRequest = require('../models/CertificateRequest');
  const GatePass = require('../models/GatePass');
  const Notice = require('../models/Notice');
  const CampusRequest = require('../models/CampusRequest');

  const [
    totalStudents,
    totalFaculty,
    totalComplaints,
    criticalComplaints,
    highPriorityComplaints,
    pendingComplaints,
    resolvedComplaints,
    pendingLeave,
    pendingCertificates,
    pendingGatePass,
    totalNotices,
    serviceRequests
  ] = await Promise.all([
    User.countDocuments({ role: 'STUDENT' }),
    User.countDocuments({ role: 'FACULTY' }),
    Complaint.countDocuments(),
    Complaint.countDocuments({ $or: [{ finalPriority: 'CRITICAL' }, { priority: 'CRITICAL' }] }),
    Complaint.countDocuments({ $or: [{ finalPriority: 'HIGH' }, { priority: 'HIGH' }] }),
    Complaint.countDocuments({ status: 'PENDING' }),
    Complaint.countDocuments({ status: 'RESOLVED' }),
    LeaveRequest.countDocuments({ status: 'PENDING' }),
    CertificateRequest.countDocuments({ status: 'PENDING' }),
    GatePass.countDocuments({ status: 'PENDING' }),
    Notice.countDocuments(),
    CampusRequest.countDocuments()
  ]);

  res.json({
    success: true,
    data: {
      totalStudents,
      totalFaculty,
      totalComplaints,
      criticalComplaints,
      highPriorityComplaints,
      pendingComplaints,
      resolvedComplaints,
      pendingLeave,
      pendingCertificates,
      pendingGatePass,
      totalNotices,
      serviceRequests
    }
  });
});

module.exports = { getUsers, getUserById, updateUser, deleteUser, getDashboardStats };
