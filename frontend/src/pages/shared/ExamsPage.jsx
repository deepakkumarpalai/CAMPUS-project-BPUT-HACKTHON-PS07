import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync';
import { examService } from '../../services/examService';
import { academicService } from '../../services/academicService';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Modal from '../../components/Modal.jsx';
import { formatDate } from '../../utils/format.js';

const emptyExam = {
  course: '',
  subject: '',
  examType: 'FINAL',
  date: '',
  startTime: '',
  endTime: '',
  venue: '',
  maxMarks: 100
};

export default function ExamsPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN';
  const { data, loading, error, reload } = useAsync(async () => {
    const [exams, students, academicRecords] = await Promise.all([
      examService.list(),
      canManage ? userService.list({ role: 'STUDENT' }) : Promise.resolve({ data: { data: [] } }),
      academicService.list()
    ]);
    return { exams: exams.data.data, students: students.data.data, academicRecords: academicRecords.data.data };
  }, [canManage]);
  const { push } = useToast();
  const [examOpen, setExamOpen] = useState(false);
  const [resultExam, setResultExam] = useState(null);
  const [examForm, setExamForm] = useState(emptyExam);
  const [resultForm, setResultForm] = useState({ studentId: '', marks: '', remarks: '' });
  const [workbook, setWorkbook] = useState(null);
  const [importing, setImporting] = useState(false);

  const importWorkbook = async (e) => {
    e.preventDefault();
    if (!workbook) {
      push('Choose an .xlsx workbook to import', 'error');
      return;
    }
    setImporting(true);
    try {
      const response = await academicService.importWorkbook(workbook);
      const { studentsImported, courseRowsImported, sampleOrDemoData } = response.data.data;
      push(
        `Imported ${courseRowsImported} course rows for ${studentsImported} students${sampleOrDemoData ? ' (sample/demo data)' : ''}`,
        'success'
      );
      setWorkbook(null);
      e.currentTarget.reset();
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not import academic workbook', 'error');
    } finally {
      setImporting(false);
    }
  };

  const createExam = async (e) => {
    e.preventDefault();
    try {
      await examService.create({ ...examForm, date: new Date(`${examForm.date}T00:00:00`).toISOString() });
      push('Exam added to the timetable', 'success');
      setExamOpen(false);
      setExamForm(emptyExam);
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not save exam', 'error');
    }
  };

  const saveResult = async (e) => {
    e.preventDefault();
    try {
      await examService.setResult(resultExam._id, resultForm);
      push('Student result saved', 'success');
      setResultExam(null);
      setResultForm({ studentId: '', marks: '', remarks: '' });
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not save result', 'error');
    }
  };

  const remove = async (id) => {
    try {
      await examService.remove(id);
      push('Exam removed', 'success');
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not remove exam', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold">Exams</h1><p className="text-sm text-slate-500">Timetable and published marks</p></div>
        {canManage && <button className="btn-primary" type="button" onClick={() => setExamOpen(true)}>Add exam</button>}
      </div>
      {canManage && <section className="card space-y-3">
        <div>
          <h2 className="font-semibold">Import academic workbook</h2>
          <p className="mt-1 text-sm text-slate-600">Upload an .xlsx file containing the “8 Semester Course Marks” and “Student Academic Summary” sheets (maximum 5 MB). Add an optional “Date of Birth” column to the summary sheet to enable student registration-number + DOB sign-in. DOBs are saved as bcrypt hashes for matching student accounts. Re-importing replaces academic records for those registration numbers.</p>
          <p className="mt-1 text-sm font-medium text-amber-700">The provided workbook labels numeric results as sample/demo and has no numeric marks for semesters 5–8. Its new Date of Birth column is blank; enter verified dates from official student records before re-importing. Course names, grades and attendance are shown when present; missing numeric marks stay blank and are labelled.</p>
        </div>
        <form className="flex flex-wrap items-end gap-3" onSubmit={importWorkbook}>
          <div className="min-w-64 flex-1"><label htmlFor="academic-workbook">Excel workbook (.xlsx)</label><input id="academic-workbook" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setWorkbook(e.target.files?.[0] || null)} /></div>
          <button className="btn-primary" type="submit" disabled={importing}>{importing ? 'Importing…' : 'Import workbook'}</button>
        </form>
        <p className="text-xs text-slate-500">Students see their record when their account’s Student ID matches the workbook’s registration number. The workbook contains no faculty records.</p>
      </section>}
      {!data.exams.length ? <div className="card text-slate-500">No exams have been scheduled.</div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.exams.map((exam) => {
            const ownResult = exam.results.find((result) => result.student?._id === user?._id);
            return (
              <article className="card" key={exam._id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-blue-700">{exam.examType} · {exam.course}</p>
                    <h2 className="mt-1 font-semibold">{exam.subject}</h2>
                  </div>
                  {canManage && <div className="flex gap-2">
                    <button className="btn-secondary" type="button" onClick={() => setResultExam(exam)}>Enter marks</button>
                    <button className="btn-secondary" type="button" onClick={() => remove(exam._id)}>Delete</button>
                  </div>}
                </div>
                <p className="mt-3 text-sm">{formatDate(exam.date)} · {exam.startTime}–{exam.endTime}</p>
                {exam.venue && <p className="text-sm text-slate-500">Venue: {exam.venue}</p>}
                {ownResult && <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-800">Your marks: {ownResult.marks} / {exam.maxMarks}{ownResult.remarks ? ` · ${ownResult.remarks}` : ''}</p>}
                {user?.role === 'STUDENT' && <Link className="mt-3 inline-block text-sm text-blue-700 underline" to={`/student/interactions?category=RESULT&title=${encodeURIComponent(`Result query: ${exam.subject}`)}`}>Report a result issue</Link>}
              </article>
            );
          })}
        </div>
      )}
      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">Academic records</h2>
          {user?.role === 'STUDENT' && <p className="text-sm text-slate-500">Your semester course marks and grades</p>}
        </div>
        {!data.academicRecords.length ? (
          <div className="card text-slate-500">{user?.role === 'STUDENT' ? 'No imported academic record matches your Student ID yet.' : 'No academic workbooks have been imported yet.'}</div>
        ) : data.academicRecords.map((record) => (
          <article className="card space-y-4" key={record._id}>
            <div>
              <h3 className="font-semibold">{record.studentName} · {record.registrationNo}</h3>
              {record.currentCgpa !== null && <p className="mt-1 text-sm">Current CGPA: <strong>{record.currentCgpa}</strong></p>}
              {record.hasSampleData && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800">This workbook contains sample/demo data. These marks are not official results.</p>}
              {user?.role === 'STUDENT' && !user.studentId && <p className="mt-2 text-sm text-amber-700">Your account has no Student ID, so it cannot be matched to imported records. Ask an administrator to update your profile with your registration number.</p>}
            </div>
            {record.semesters.map((semester) => {
              const sgpa = record.semesterSgpa.find((item) => item.semester === semester.semester)?.sgpa;
              return (
                <div className="overflow-hidden rounded-lg border border-slate-200" key={semester.semester}>
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-3">
                    <h4 className="font-medium">Semester {semester.semester}</h4>
                    {sgpa !== null && sgpa !== undefined && <span className="text-sm">SGPA: <strong>{sgpa}</strong></span>}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="text-xs uppercase text-slate-500"><tr>
                        <th className="px-3 py-2">Subject</th><th className="px-3 py-2">Credits</th><th className="px-3 py-2">Internal</th><th className="px-3 py-2">External</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Grade</th><th className="px-3 py-2">Attendance</th><th className="px-3 py-2">Data label</th>
                      </tr></thead>
                      <tbody>{semester.courses.map((course) => <tr className="border-t border-slate-100" key={course.subjectCode}>
                        <td className="px-3 py-2"><strong>{course.subjectCode}</strong><br />{course.subjectName}</td>
                        <td className="px-3 py-2">{course.credits ?? '—'}</td>
                        <td className="px-3 py-2">{course.internalMarks ?? '—'}</td>
                        <td className="px-3 py-2">{course.externalMarks ?? '—'}</td>
                        <td className="px-3 py-2">{course.totalMarks ?? '—'}</td>
                        <td className="px-3 py-2">{course.grade || '—'}</td>
                        <td className="px-3 py-2">{course.attendancePercent === null ? '—' : `${course.attendancePercent}%`}</td>
                        <td className="px-3 py-2">{course.marksStatus === 'NO_NUMERIC_MARKS' ? 'NUMERIC MARKS NOT PROVIDED' : course.marksStatus}</td>
                      </tr>)}</tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {record.sourceNotes?.length > 0 && <details className="text-sm text-slate-600">
              <summary className="cursor-pointer font-medium">Spreadsheet notes</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">{record.sourceNotes.map((note) => <li key={note}>{note}</li>)}</ul>
            </details>}
          </article>
        ))}
      </section>
      <Modal open={examOpen} title="Add exam to timetable" onClose={() => setExamOpen(false)}>
        <form onSubmit={createExam} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label>Course</label><input required value={examForm.course} onChange={(e) => setExamForm({ ...examForm, course: e.target.value })} /></div>
            <div><label>Subject</label><input required value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })} /></div>
            <div><label>Exam type</label><input required value={examForm.examType} onChange={(e) => setExamForm({ ...examForm, examType: e.target.value })} /></div>
            <div><label>Exam date</label><input required type="date" value={examForm.date} onChange={(e) => setExamForm({ ...examForm, date: e.target.value })} /></div>
            <div><label>Start time</label><input required type="time" value={examForm.startTime} onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })} /></div>
            <div><label>End time</label><input required type="time" value={examForm.endTime} onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })} /></div>
            <div><label>Venue</label><input value={examForm.venue} onChange={(e) => setExamForm({ ...examForm, venue: e.target.value })} /></div>
            <div><label>Maximum marks</label><input required type="number" min="1" value={examForm.maxMarks} onChange={(e) => setExamForm({ ...examForm, maxMarks: e.target.value })} /></div>
          </div>
          <button className="btn-primary" type="submit">Save exam</button>
        </form>
      </Modal>
      <Modal open={Boolean(resultExam)} title={`Enter marks · ${resultExam?.subject || ''}`} onClose={() => setResultExam(null)}>
        <form onSubmit={saveResult} className="space-y-3">
          <div><label>Student</label><select required value={resultForm.studentId} onChange={(e) => setResultForm({ ...resultForm, studentId: e.target.value })}><option value="">Select a student</option>{data.students.map((student) => <option key={student._id} value={student._id}>{student.name} · {student.studentId || student.email}</option>)}</select></div>
          <div><label>Marks (out of {resultExam?.maxMarks})</label><input required type="number" min="0" max={resultExam?.maxMarks} step="0.01" value={resultForm.marks} onChange={(e) => setResultForm({ ...resultForm, marks: e.target.value })} /></div>
          <div><label>Remarks (optional)</label><textarea rows={2} value={resultForm.remarks} onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })} /></div>
          <button className="btn-primary" type="submit">Publish marks</button>
        </form>
      </Modal>
    </div>
  );
}
