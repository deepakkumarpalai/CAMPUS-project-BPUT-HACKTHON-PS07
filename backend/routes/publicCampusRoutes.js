const express = require('express');
const {
  getPublicNotices,
  getPublicEvents,
  getPublicFaculty
} = require('../controllers/publicCampusController');

const router = express.Router();

router.get('/notices', getPublicNotices);
router.get('/events', getPublicEvents);
router.get('/faculty', getPublicFaculty);

module.exports = router;
