const Event = require('../models/Event');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { notifyRole } = require('../services/notificationService');

const notifyCampus = async (event, verb) => {
  const kind = event.kind === 'HOLIDAY' ? 'College holiday' : 'Campus event';
  const message = `${event.title} · ${new Date(event.startsAt).toLocaleDateString('en-IN')}`;
  await Promise.all(
    ['STUDENT', 'FACULTY'].map((role) =>
      notifyRole({ role, title: `${kind} ${verb}`, message, type: 'EVENT' })
    )
  );
};

const getEvents = asyncHandler(async (_req, res) => {
  const events = await Event.find().populate('createdBy', 'name').sort({ startsAt: 1 });
  res.json({ success: true, count: events.length, data: events });
});

const createEvent = asyncHandler(async (req, res) => {
  const { title, description, kind, startsAt, endsAt, location } = req.body;
  if (!title || !description || !startsAt || Number.isNaN(new Date(startsAt).getTime())) {
    return res.status(400).json({ success: false, message: 'Title, description, and a valid date are required.' });
  }
  if (kind && !['EVENT', 'HOLIDAY'].includes(kind)) {
    return res.status(400).json({ success: false, message: 'Type must be EVENT or HOLIDAY.' });
  }
  if (endsAt && new Date(endsAt) < new Date(startsAt)) {
    return res.status(400).json({ success: false, message: 'End date cannot be before the start date.' });
  }
  const event = await Event.create({
    title,
    description,
    kind: kind || 'EVENT',
    startsAt,
    endsAt: endsAt || undefined,
    location,
    createdBy: req.user._id
  });
  await notifyCampus(event, 'published');
  res.status(201).json({ success: true, data: event });
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

  const allowed = ['title', 'description', 'kind', 'startsAt', 'endsAt', 'location'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) event[field] = req.body[field];
  });
  if (!['EVENT', 'HOLIDAY'].includes(event.kind)) {
    return res.status(400).json({ success: false, message: 'Type must be EVENT or HOLIDAY.' });
  }
  if (!event.title || !event.description || Number.isNaN(new Date(event.startsAt).getTime())) {
    return res.status(400).json({ success: false, message: 'Title, description, and a valid date are required.' });
  }
  if (event.endsAt && event.endsAt < event.startsAt) {
    return res.status(400).json({ success: false, message: 'End date cannot be before the start date.' });
  }
  await event.save();
  await notifyCampus(event, 'updated');
  res.json({ success: true, data: event });
});

const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
  res.json({ success: true, message: 'Event deleted.' });
});

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
