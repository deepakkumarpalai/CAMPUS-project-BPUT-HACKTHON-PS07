const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { validateAuth } = require('../validators/authValidator');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  department: user.department,
  studentId: user.studentId,
  year: user.year,
  group: user.group,
  facultyId: user.facultyId,
  profileImage: user.profileImage,
  courses: user.courses || [],
  isDemo: user.isDemo,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const register = asyncHandler(async (req, res) => {
  const errors = validateAuth(req.body, { isRegister: true });
  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  const { name, email, password, role, phone, department, studentId, facultyId, year, group } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
  }

  const assignedRole = role === 'FACULTY' ? 'FACULTY' : 'STUDENT';
  const user = await User.create({
    name,
    email,
    password,
    role: assignedRole,
    phone,
    department,
    studentId,
    facultyId,
    year: assignedRole === 'STUDENT' && year ? Number(year) : undefined,
    group: assignedRole === 'STUDENT' ? group : undefined
  });

  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: sanitizeUser(user)
  });
});

const login = asyncHandler(async (req, res) => {
  const errors = validateAuth(req.body);
  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  let user;
  if (req.body.registrationNo !== undefined || req.body.dateOfBirth !== undefined) {
    user = await User.findOne({
      role: 'STUDENT',
      studentId: req.body.registrationNo.trim()
    }).select('+studentDobHash');
    if (!user || !(await user.matchStudentDob(req.body.dateOfBirth))) {
      return res.status(401).json({ success: false, message: 'Invalid registration number or date of birth.' });
    }
  } else {
    user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !(await user.matchPassword(req.body.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
  }

  res.json({
    success: true,
    token: generateToken(user._id),
    user: sanitizeUser(user)
  });
});

const setStudentDateOfBirth = asyncHandler(async (req, res) => {
  const { dateOfBirth } = req.body;
  if (typeof dateOfBirth !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return res.status(400).json({ success: false, message: 'Enter a valid date of birth.' });
  }
  const [year, month, day] = dateOfBirth.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day ||
    parsed > new Date()
  ) {
    return res.status(400).json({ success: false, message: 'Enter a valid date of birth.' });
  }

  const user = await User.findOne({ _id: req.params.id, role: 'STUDENT' }).select('+studentDobHash');
  if (!user) return res.status(404).json({ success: false, message: 'Student account not found.' });
  user.studentDobHash = await bcrypt.hash(dateOfBirth, 12);
  await user.save();
  res.json({ success: true, message: 'Student DOB sign-in has been enabled.' });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});

module.exports = { register, login, setStudentDateOfBirth, getMe, sanitizeUser, generateToken };
