import { useState } from 'react';
import { attendanceService } from '../../services/attendanceService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function FacultyAttendance() {
  const { push } = useToast();
  const students = useAsync(async () => (await attendanceService.students()).data.data, []);
  const records = useAsync(async () => (await attendanceService.list()).data.data, []);
  const [form, setForm] = useState({ student: '', subject: 'Data Structures', date: '', status: 'PRESENT', semester: '4', department: 'Computer Science' });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await attendanceService.create(form);
      push('Attendance saved', 'success');
      records.reload();
    } catch (err) {
      push(err.userMessage || 'Could not save attendance', 'error');
    }
  };

  const update = async (id, status) => {
    await attendanceService.update(id, { status });
    records.reload();
  };

  if (students.loading || records.loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Attendance management</h2>
      <form onSubmit={submit} className="card grid gap-3 md:grid-cols-3">
        <div>
          <label>Student</label>
          <select required value={form.student} onChange={(e) => setForm({ ...form, student: e.target.value })}>
            <option value="">Select student</option>
            {(students.data || []).map((item) => (
              <option key={item._id} value={item._id}>{item.name} ({item.studentId || 'no ID'})</option>
            ))}
          </select>
        </div>
        <div>
          <label>Subject</label>
          <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        </div>
        <div>
          <label>Date</label>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label>Status</label>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option>PRESENT</option>
            <option>ABSENT</option>
            <option>LATE</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className="btn-primary">Mark attendance</button>
        </div>
      </form>
      <Table
        empty="No attendance records available."
        rows={records.data || []}
        columns={[
          { key: 'student', label: 'Student', render: (row) => row.student?.name },
          { key: 'subject', label: 'Subject' },
          { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          {
            key: 'act',
            label: 'Update',
            render: (row) => (
              <select value={row.status} onChange={(e) => update(row._id, e.target.value)}>
                <option>PRESENT</option>
                <option>ABSENT</option>
                <option>LATE</option>
              </select>
            )
          }
        ]}
      />
    </div>
  );
}
