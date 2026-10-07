const express = require('express');
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, getEvents);
router.post('/', protect, authorizeRoles('ADMIN'), createEvent);
router.put('/:id', protect, authorizeRoles('ADMIN'), updateEvent);
router.delete('/:id', protect, authorizeRoles('ADMIN'), deleteEvent);

module.exports = router;
