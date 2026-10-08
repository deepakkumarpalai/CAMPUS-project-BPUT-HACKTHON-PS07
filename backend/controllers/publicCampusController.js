const User = require('../models/User');
const Notice = require('../models/Notice');
const Event = require('../models/Event');
const { asyncHandler } = require('../middleware/errorMiddleware');

const toPublicFacultyProfile = (person) => ({
  name: person.name,
  department: person.department || '',
  courses: person.courses || [],
  profileImage: person.profileImage || ''
});

const getPublicNotices = asyncHandler(async (_req, res) => {
  const notices = await Notice.find({
    targetAudience: 'ALL',
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: new Date() } }]
  })
    .select('title description category department createdAt expiresAt')
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  res.json({ success: true, count: notices.length, data: notices });
});

const getPublicEvents = asyncHandler(async (_req, res) => {
  const events = await Event.find({ startsAt: { $gte: new Date() } })
    .select('title description kind startsAt endsAt location')
    .sort({ startsAt: 1 })
    .limit(30)
    .lean();
  res.json({ success: true, count: events.length, data: events });
});

const getPublicFaculty = asyncHandler(async (_req, res) => {
  const faculty = await User.find({ role: 'FACULTY' })
    .select('name department courses profileImage -_id')
    .sort({ department: 1, name: 1 })
    .lean();
  res.json({
    success: true,
    count: faculty.length,
    data: faculty.map(toPublicFacultyProfile)
  });
});

module.exports = { getPublicNotices, getPublicEvents, getPublicFaculty, toPublicFacultyProfile };
