const express = require('express');
const { getFacultyAssignments } = require('../controllers/facultyAssignmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, authorizeRoles('ADMIN'), getFacultyAssignments);

module.exports = router;
