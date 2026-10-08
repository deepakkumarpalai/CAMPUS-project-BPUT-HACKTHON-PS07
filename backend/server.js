require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { startComplaintEscalationScheduler } = require('./services/complaintEscalationService');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

connectDB().then(startComplaintEscalationScheduler);

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' }
  })
);

app.use(
  '/api/auth/login',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    message: { success: false, message: 'Too many login attempts. Please wait and try again.' }
  })
);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Smart Campus API is running.' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/public', require('./routes/publicCampusRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leave', require('./routes/leaveRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/gate-pass', require('./routes/gatePassRoutes'));
app.use('/api/visitors', require('./routes/visitorRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));
app.use('/api/campus-requests', require('./routes/campusRequestRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));
app.use('/api/interactions', require('./routes/campusProblemRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/academics', require('./routes/academicRoutes'));
app.use('/api/faculty-assignments', require('./routes/facultyAssignmentRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Smart Campus API listening on port ${PORT}`);
});
