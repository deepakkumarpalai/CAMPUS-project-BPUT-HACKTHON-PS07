const express = require('express');
const multer = require('multer');
const { importAcademicWorkbook, getAcademicRecords } = require('../controllers/academicController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

const uploadWorkbook = (req, res, next) => {
  upload.single('workbook')(req, res, (error) => {
    if (!error) return next();
    const statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(statusCode).json({
      success: false,
      message: error.code === 'LIMIT_FILE_SIZE'
        ? 'Workbook must be 5 MB or smaller.'
        : 'Upload one .xlsx workbook.'
    });
  });
};

const router = express.Router();

router.get('/', protect, getAcademicRecords);
router.post('/import', protect, authorizeRoles('ADMIN'), uploadWorkbook, importAcademicWorkbook);

module.exports = router;
