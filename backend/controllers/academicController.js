const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const AcademicRecord = require('../models/AcademicRecord');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorMiddleware');

const normalizedHeader = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const getHeaderMap = (worksheet) => {
  const headers = new Map();
  worksheet.getRow(1).eachCell((cell, column) => {
    headers.set(normalizedHeader(cell.text || cell.value), column);
  });
  return headers;
};

const requireHeaders = (headers, names, sheetName) => {
  const missing = names.filter((name) => !headers.has(normalizedHeader(name)));
  if (missing.length) {
    const error = new Error(`${sheetName} is missing required columns: ${missing.join(', ')}.`);
    error.statusCode = 400;
    throw error;
  }
};

const cellValue = (worksheet, headers, rowNumber, header) => {
  const column = headers.get(normalizedHeader(header));
  const value = worksheet.getRow(rowNumber).getCell(column).value;
  if (value && typeof value === 'object' && 'result' in value) return value.result;
  return value;
};

const textValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  return String(value).trim();
};

const optionalNumber = (value, label, rowNumber, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    const error = new Error(`Invalid ${label} at row ${rowNumber}.`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
};

const optionalDateOfBirth = (value, rowNumber) => {
  if (value === null || value === undefined || value === '') return null;

  let year;
  let month;
  let day;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    year = value.getUTCFullYear();
    month = value.getUTCMonth() + 1;
    day = value.getUTCDate();
  } else if (typeof value === 'string') {
    const iso = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const local = value.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (iso) {
      [, year, month, day] = iso.map(Number);
    } else if (local) {
      [, day, month, year] = local.map(Number);
    }
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    !year ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date > new Date()
  ) {
    const error = new Error(`Invalid date of birth at academic summary row ${rowNumber}. Use a real date, such as YYYY-MM-DD.`);
    error.statusCode = 400;
    throw error;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const workbookNotes = (worksheet) => {
  if (!worksheet) return [];
  const notes = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const note = textValue(row.getCell(1).value);
    const details = textValue(row.getCell(2).value);
    if (note || details) notes.push([note, details].filter(Boolean).join(': '));
  });
  return notes;
};

const importAcademicWorkbook = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Choose an .xlsx academic workbook to import.' });
  }
  if (!req.file.originalname.toLowerCase().endsWith('.xlsx')) {
    return res.status(400).json({ success: false, message: 'Only .xlsx workbooks are supported.' });
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(req.file.buffer);
  } catch {
    return res.status(400).json({ success: false, message: 'The uploaded file is not a readable .xlsx workbook.' });
  }

  const marksSheet = workbook.getWorksheet('8 Semester Course Marks');
  const summarySheet = workbook.getWorksheet('Student Academic Summary');
  if (!marksSheet || !summarySheet) {
    return res.status(400).json({
      success: false,
      message: 'Workbook must include “8 Semester Course Marks” and “Student Academic Summary” sheets.'
    });
  }
  if (marksSheet.rowCount > 2001 || summarySheet.rowCount > 501) {
    return res.status(400).json({ success: false, message: 'Workbook exceeds the 2,000-course-row or 500-student import limit.' });
  }

  const markHeaders = getHeaderMap(marksSheet);
  const summaryHeaders = getHeaderMap(summarySheet);
  requireHeaders(markHeaders, [
    'Regd No', 'Name', 'Semester', 'Subject Code', 'Course / Subject Name',
    'Credits', 'Internal Marks', 'External Marks', 'Total Marks', 'Grade',
    'Attendance %', 'SGPA'
  ], marksSheet.name);
  requireHeaders(summaryHeaders, [
    'Regd No', 'Name', 'Sem 1 SGPA', 'Sem 2 SGPA', 'Sem 3 SGPA',
    'Sem 4 SGPA', 'Sem 5 SGPA', 'Sem 6 SGPA', 'Sem 7 SGPA',
    'Sem 8 SGPA', 'Current CGPA'
  ], summarySheet.name);

  const notes = workbookNotes(workbook.getWorksheet('Notes'));
  const sourceText = notes.join(' ').toLowerCase();
  const flaggedSampleWorkbook = /\bsample\b|\bdemo\b/.test(sourceText);
  const students = new Map();
  const subjectKeys = new Set();

  for (let rowNumber = 2; rowNumber <= marksSheet.rowCount; rowNumber += 1) {
    const registrationNo = textValue(cellValue(marksSheet, markHeaders, rowNumber, 'Regd No'));
    if (!registrationNo) continue;

    const studentName = textValue(cellValue(marksSheet, markHeaders, rowNumber, 'Name'));
    const semester = optionalNumber(cellValue(marksSheet, markHeaders, rowNumber, 'Semester'), 'semester', rowNumber, { min: 1, max: 8 });
    const subjectCode = textValue(cellValue(marksSheet, markHeaders, rowNumber, 'Subject Code'));
    const subjectName = textValue(cellValue(marksSheet, markHeaders, rowNumber, 'Course / Subject Name'));
    if (!studentName || !subjectCode || !subjectName || !Number.isInteger(semester)) {
      const error = new Error(`Student name, semester (1–8), subject code, and subject name are required at row ${rowNumber}.`);
      error.statusCode = 400;
      throw error;
    }

    const subjectKey = `${registrationNo}|${semester}|${subjectCode.toLowerCase()}`;
    if (subjectKeys.has(subjectKey)) {
      const error = new Error(`Duplicate registration number, semester, and subject code at row ${rowNumber}.`);
      error.statusCode = 400;
      throw error;
    }
    subjectKeys.add(subjectKey);

    const internalMarks = optionalNumber(cellValue(marksSheet, markHeaders, rowNumber, 'Internal Marks'), 'internal marks', rowNumber);
    const externalMarks = optionalNumber(cellValue(marksSheet, markHeaders, rowNumber, 'External Marks'), 'external marks', rowNumber);
    const totalMarks = optionalNumber(cellValue(marksSheet, markHeaders, rowNumber, 'Total Marks'), 'total marks', rowNumber);
    const hasMarks = [internalMarks, externalMarks, totalMarks].some((mark) => mark !== null);
    const marksStatus = !hasMarks
      ? 'NO_NUMERIC_MARKS'
      : (semester === 4 && flaggedSampleWorkbook ? 'DEMO' : (flaggedSampleWorkbook && semester <= 3 ? 'SAMPLE' : 'PROVIDED'));

    let student = students.get(registrationNo);
    if (!student) {
      student = {
        registrationNo,
        studentName,
        dateOfBirth: null,
        semesters: new Map(),
        semesterSgpa: new Map(),
        currentCgpa: null,
        hasSampleData: flaggedSampleWorkbook,
        sourceNotes: notes
      };
      students.set(registrationNo, student);
    } else if (student.studentName.toLowerCase() !== studentName.toLowerCase()) {
      const error = new Error(`Conflicting student names for registration number ${registrationNo}.`);
      error.statusCode = 400;
      throw error;
    }

    const course = {
      subjectCode,
      subjectName,
      credits: optionalNumber(cellValue(marksSheet, markHeaders, rowNumber, 'Credits'), 'credits', rowNumber),
      internalMarks,
      externalMarks,
      totalMarks,
      grade: textValue(cellValue(marksSheet, markHeaders, rowNumber, 'Grade')),
      attendancePercent: optionalNumber(cellValue(marksSheet, markHeaders, rowNumber, 'Attendance %'), 'attendance percentage', rowNumber, { max: 100 }),
      sgpa: optionalNumber(cellValue(marksSheet, markHeaders, rowNumber, 'SGPA'), 'SGPA', rowNumber, { max: 10 }),
      marksStatus
    };
    if (!student.semesters.has(semester)) student.semesters.set(semester, []);
    student.semesters.get(semester).push(course);
    const sgpa = optionalNumber(cellValue(marksSheet, markHeaders, rowNumber, 'SGPA'), 'SGPA', rowNumber, { max: 10 });
    if (sgpa !== null) student.semesterSgpa.set(semester, sgpa);
  }

  const summaryRegistrations = new Set();
  for (let rowNumber = 2; rowNumber <= summarySheet.rowCount; rowNumber += 1) {
    const registrationNo = textValue(cellValue(summarySheet, summaryHeaders, rowNumber, 'Regd No'));
    if (!registrationNo) continue;
    if (!students.has(registrationNo)) {
      const error = new Error(`Academic summary contains registration number ${registrationNo}, which is missing from the course marks sheet.`);
      error.statusCode = 400;
      throw error;
    }
    if (summaryRegistrations.has(registrationNo)) {
      const error = new Error(`Duplicate registration number ${registrationNo} in the academic summary.`);
      error.statusCode = 400;
      throw error;
    }
    summaryRegistrations.add(registrationNo);
    const student = students.get(registrationNo);
    const summaryName = textValue(cellValue(summarySheet, summaryHeaders, rowNumber, 'Name'));
    if (summaryName && student.studentName.toLowerCase() !== summaryName.toLowerCase()) {
      const error = new Error(`Student name mismatch for registration number ${registrationNo} between workbook sheets.`);
      error.statusCode = 400;
      throw error;
    }
    if (summaryHeaders.has(normalizedHeader('Date of Birth'))) {
      const dateOfBirth = optionalDateOfBirth(
        cellValue(summarySheet, summaryHeaders, rowNumber, 'Date of Birth'),
        rowNumber
      );
      if (dateOfBirth) student.dateOfBirth = dateOfBirth;
    }
    for (let semester = 1; semester <= 8; semester += 1) {
      const sgpa = optionalNumber(cellValue(summarySheet, summaryHeaders, rowNumber, `Sem ${semester} SGPA`), `semester ${semester} SGPA`, rowNumber, { max: 10 });
      if (sgpa !== null) student.semesterSgpa.set(semester, sgpa);
    }
    student.currentCgpa = optionalNumber(cellValue(summarySheet, summaryHeaders, rowNumber, 'Current CGPA'), 'current CGPA', rowNumber, { max: 10 });
  }

  if (students.size === 0) {
    return res.status(400).json({ success: false, message: 'No student course records were found in the workbook.' });
  }
  if (summaryRegistrations.size !== students.size) {
    return res.status(400).json({ success: false, message: 'Every student in the course sheet must have one academic summary row.' });
  }

  const importedAt = new Date();
  const operations = [...students.values()].map((student) => ({
    updateOne: {
      filter: { registrationNo: student.registrationNo },
      update: {
        $set: {
          registrationNo: student.registrationNo,
          studentName: student.studentName,
          semesters: [...student.semesters.entries()]
            .sort(([a], [b]) => a - b)
            .map(([semester, courses]) => ({ semester, courses })),
          semesterSgpa: [...student.semesterSgpa.entries()]
            .sort(([a], [b]) => a - b)
            .map(([semester, sgpa]) => ({ semester, sgpa })),
          currentCgpa: student.currentCgpa,
          hasSampleData: student.hasSampleData,
          sourceNotes: student.sourceNotes,
          importedAt
        }
      },
      upsert: true
    }
  }));
  await AcademicRecord.bulkWrite(operations, { ordered: true });

  const studentsWithDob = [...students.values()].filter((student) => student.dateOfBirth);
  let dobAccountsUpdated = 0;
  const dobAccountsMissing = [];
  if (studentsWithDob.length) {
    const registrationNumbers = studentsWithDob.map((student) => student.registrationNo);
    const matchedAccounts = await User.find({
      role: 'STUDENT',
      studentId: { $in: registrationNumbers }
    }).select('_id studentId');
    const accountByRegistration = new Map();
    for (const account of matchedAccounts) {
      const key = (account.studentId || '').trim();
      if (accountByRegistration.has(key)) {
        const error = new Error(`Multiple student accounts use registration number ${key}; resolve the duplicate before importing DOB credentials.`);
        error.statusCode = 409;
        throw error;
      }
      accountByRegistration.set(key, account);
    }

    const dobOperations = await Promise.all(studentsWithDob.map(async (student) => {
      const account = accountByRegistration.get(student.registrationNo);
      if (!account) {
        dobAccountsMissing.push(student.registrationNo);
        return null;
      }
      return {
        updateOne: {
          filter: { _id: account._id, role: 'STUDENT' },
          update: { $set: { studentDobHash: await bcrypt.hash(student.dateOfBirth, 12) } }
        }
      };
    }));
    const updates = dobOperations.filter(Boolean);
    if (updates.length) {
      await User.bulkWrite(updates, { ordered: true });
      dobAccountsUpdated = updates.length;
    }
  }

  res.json({
    success: true,
    data: {
      studentsImported: students.size,
      courseRowsImported: subjectKeys.size,
      sampleOrDemoData: flaggedSampleWorkbook,
      dobAccountsUpdated,
      dobAccountsMissing,
      importedAt
    }
  });
});

const getAcademicRecords = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'STUDENT'
    ? { registrationNo: (req.user.studentId || '').trim() }
    : {};
  const records = await AcademicRecord.find(filter).sort({ registrationNo: 1 });
  res.json({ success: true, count: records.length, data: records });
});

module.exports = { importAcademicWorkbook, getAcademicRecords };
