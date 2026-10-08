require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Notice = require('../models/Notice');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Complaint = require('../models/Complaint');
const CertificateRequest = require('../models/CertificateRequest');
const GatePass = require('../models/GatePass');
const CampusRequest = require('../models/CampusRequest');
const Notification = require('../models/Notification');
const AIAnalysis = require('../models/AIAnalysis');
const { getSlaDeadline } = require('../services/complaintSla');

const DEMO_MARKER = true;

const seed = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI missing in .env');
    process.exit(1);
  }

  const requiredPasswords = [
    'DEMO_ADMIN_PASSWORD',
    'DEMO_FACULTY_PASSWORD',
    'DEMO_STUDENT_PASSWORD'
  ];
  const missingPasswords = requiredPasswords.filter((name) => !process.env[name]);
  if (missingPasswords.length > 0) {
    console.error(`Missing required demo passwords in .env: ${missingPasswords.join(', ')}`);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas for DEMO seeding.');

  await Promise.all([
    User.deleteMany({ isDemo: true }),
    Notice.deleteMany({}),
    Attendance.deleteMany({}),
    LeaveRequest.deleteMany({}),
    Complaint.deleteMany({}),
    CertificateRequest.deleteMany({}),
    GatePass.deleteMany({}),
    CampusRequest.deleteMany({}),
    Notification.deleteMany({}),
    AIAnalysis.deleteMany({})
  ]);

  const admin = await User.create({
    name: 'DEMO Admin',
    email: 'admin@campus.edu',
    password: process.env.DEMO_ADMIN_PASSWORD,
    role: 'ADMIN',
    phone: '9990001111',
    department: 'Administration',
    isDemo: DEMO_MARKER
  });

  const faculty = await User.create({
    name: 'DEMO Faculty',
    email: 'faculty@campus.edu',
    password: process.env.DEMO_FACULTY_PASSWORD,
    role: 'FACULTY',
    phone: '9990002222',
    department: 'Computer Science',
    facultyId: 'FAC-DEMO-01',
    courses: ['Data Structures', 'Database Systems'],
    isDemo: DEMO_MARKER
  });

  const student = await User.create({
    name: 'DEMO Student',
    email: 'student@campus.edu',
    password: process.env.DEMO_STUDENT_PASSWORD,
    role: 'STUDENT',
    phone: '9990003333',
    department: 'Computer Science',
    studentId: 'STU-DEMO-01',
    isDemo: DEMO_MARKER
  });

  const studentTwo = await User.create({
    name: 'DEMO Student Two',
    email: 'student2@campus.edu',
    password: process.env.DEMO_STUDENT_PASSWORD,
    role: 'STUDENT',
    phone: '9990004444',
    department: 'Computer Science',
    studentId: 'STU-DEMO-02',
    isDemo: DEMO_MARKER
  });

  const notices = await Notice.insertMany([
    {
      title: 'DEMO: Mid-semester examinations',
      description: 'Mid-semester exams begin next Monday. Check the academic calendar.',
      category: 'ACADEMIC',
      targetAudience: 'STUDENTS',
      priority: 'HIGH',
      createdBy: admin._id
    },
    {
      title: 'DEMO: Faculty meeting',
      description: 'All faculty members are requested to attend the monthly review meeting.',
      category: 'ADMIN',
      targetAudience: 'FACULTY',
      priority: 'MEDIUM',
      createdBy: admin._id
    },
    {
      title: 'DEMO: Campus maintenance window',
      description: 'Water maintenance in Hostel Block B this weekend.',
      category: 'MAINTENANCE',
      targetAudience: 'ALL',
      priority: 'HIGH',
      createdBy: admin._id
    }
  ]);

  const today = new Date();
  await Attendance.insertMany([
    {
      student: student._id,
      faculty: faculty._id,
      subject: 'Data Structures',
      date: new Date(today.getTime() - 86400000 * 2),
      status: 'PRESENT',
      semester: '4',
      department: 'Computer Science'
    },
    {
      student: student._id,
      faculty: faculty._id,
      subject: 'Data Structures',
      date: new Date(today.getTime() - 86400000),
      status: 'LATE',
      semester: '4',
      department: 'Computer Science'
    },
    {
      student: student._id,
      faculty: faculty._id,
      subject: 'Database Systems',
      date: today,
      status: 'ABSENT',
      semester: '4',
      department: 'Computer Science'
    },
    {
      student: studentTwo._id,
      faculty: faculty._id,
      subject: 'Database Systems',
      date: today,
      status: 'PRESENT',
      semester: '4',
      department: 'Computer Science'
    }
  ]);

  await LeaveRequest.create({
    student: student._id,
    leaveType: 'SICK',
    fromDate: today,
    toDate: new Date(today.getTime() + 86400000 * 2),
    reason: 'DEMO: Medical appointment and recovery.',
    status: 'PENDING'
  });

  const waterComplaint = await Complaint.create({
    title: 'DEMO: No water in Hostel Block B',
    description: 'The water supply has stopped in Hostel Block B since morning and many students are affected.',
    category: 'WATER',
    priority: 'HIGH',
    dueAt: getSlaDeadline('HIGH'),
    aiRecommendedPriority: 'HIGH',
    finalPriority: 'HIGH',
    priorityReason: 'An essential service is unavailable and multiple students may be affected.',
    status: 'PENDING',
    submittedBy: student._id,
    department: 'HOSTEL_MAINTENANCE',
    location: 'Hostel Block B'
  });

  const relatedComplaint = await Complaint.create({
    title: 'DEMO: Hostel B water supply is not working',
    description: 'Hostel B water supply is not working. Students cannot fill bottles.',
    category: 'WATER',
    priority: 'HIGH',
    dueAt: getSlaDeadline('HIGH'),
    aiRecommendedPriority: 'HIGH',
    finalPriority: 'HIGH',
    status: 'PENDING',
    submittedBy: studentTwo._id,
    department: 'HOSTEL_MAINTENANCE',
    location: 'Hostel Block B',
    linkedComplaints: [waterComplaint._id]
  });

  waterComplaint.linkedComplaints = [relatedComplaint._id];
  await waterComplaint.save();

  const analysis = await AIAnalysis.create({
    sourceType: 'COMPLAINT',
    sourceId: waterComplaint._id,
    analysisMode: 'RULE_BASED',
    category: 'WATER',
    priority: 'HIGH',
    keywords: ['water', 'hostel', 'supply', 'students'],
    department: 'HOSTEL_MAINTENANCE',
    summary: 'Water supply disruption reported in Hostel Block B.',
    reason: 'An essential service is unavailable and multiple students may be affected.',
    possibleDuplicate: true,
    relatedItems: [{ id: relatedComplaint._id, title: relatedComplaint.title, similarity: 0.62 }]
  });
  waterComplaint.aiAnalysis = analysis._id;
  await waterComplaint.save();

  await Complaint.create({
    title: 'DEMO: Classroom projector not working',
    description: 'The projector in CS-201 is not turning on before lectures.',
    category: 'ACADEMIC',
    priority: 'MEDIUM',
    dueAt: getSlaDeadline('MEDIUM'),
    aiRecommendedPriority: 'MEDIUM',
    finalPriority: 'MEDIUM',
    status: 'IN_PROGRESS',
    submittedBy: student._id,
    assignedTo: faculty._id,
    department: 'ACADEMICS',
    location: 'CS-201'
  });

  await CertificateRequest.create({
    student: student._id,
    certificateType: 'BONAFIDE',
    reason: 'DEMO: Required for internship application.',
    status: 'PENDING'
  });

  await GatePass.create({
    student: student._id,
    destination: 'City Hospital',
    reason: 'DEMO: Medical checkup',
    departureDate: today,
    returnDate: new Date(today.getTime() + 86400000),
    emergencyContact: '9990005555',
    status: 'PENDING'
  });

  await CampusRequest.create({
    title: 'DEMO: Broken classroom chair',
    description: 'Two chairs in CS-101 are broken and unsafe to sit on.',
    category: 'Furniture',
    location: 'CS-101',
    priority: 'LOW',
    aiRecommendedPriority: 'LOW',
    finalPriority: 'LOW',
    status: 'PENDING',
    submittedBy: student._id
  });

  await Notification.insertMany([
    {
      user: student._id,
      title: 'Welcome to Smart Campus (DEMO)',
      message: 'This is a demo student account. Explore notices, attendance and requests.',
      type: 'SYSTEM'
    },
    {
      user: admin._id,
      title: 'DEMO complaints need review',
      message: 'Two related water complaints were seeded for AI duplicate review.',
      type: 'COMPLAINT'
    }
  ]);

  console.log('DEMO data seeded. Account passwords are configured in backend/.env.');
  console.log(`Notices created: ${notices.length}`);
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
