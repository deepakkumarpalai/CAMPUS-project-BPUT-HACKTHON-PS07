import { noticeService } from '../../services/noticeService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate } from '../../utils/format.js';
import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function NoticesPage({ canManage = false }) {
  const { data, loading, error, reload } = useAsync(async () => (await noticeService.list()).data.data, []);
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'GENERAL',
    targetAudience: 'ALL',
    priority: 'MEDIUM',
    department: '',
    targetRole: 'STUDENT',
    targetYear: '',
    targetGroup: '',
    expiresAt: ''
  });

  const create = async (e) => {
    e.preventDefault();
    try {
      await noticeService.create(form);
      push('Notice published', 'success');
      setOpen(false);
      reload();
    } catch (err) {
      push(err.userMessage || 'Failed to create notice', 'error');
    }
  };

  const remove = async (id) => {
    try {
      await noticeService.remove(id);
      push('Notice deleted', 'success');
      reload();
    } catch (err) {
      push(err.userMessage || 'Delete failed', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notices</h2>
        {canManage && (
          <button className="btn-primary" onClick={() => setOpen(true)} type="button">
            New notice
          </button>
        )}
      </div>
      {!data?.length ? (
        <div className="card text-slate-500">No notices available.</div>
      ) : (
        <div className="grid gap-4">
          {data.map((notice) => (
            <article key={notice._id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{notice.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{notice.description}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {notice.category} · {notice.targetAudience} · {formatDate(notice.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge value={notice.priority} />
                  {canManage && (
                    <button className="btn-secondary" type="button" onClick={() => remove(notice._id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal open={open} title="Publish notice" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-3">
          <div>
            <label>Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label>Description</label>
            <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label>Audience</label>
              <select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
                <option>ALL</option>
                <option>STUDENTS</option>
                <option>FACULTY</option>
                <option>SPECIFIC_DEPARTMENT</option>
                <option>SPECIFIC_ROLE</option>
                <option>SPECIFIC_YEAR</option>
                <option>SPECIFIC_GROUP</option>
              </select>
            </div>
            <div>
              <label>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option>LOW</option>
                <option>MEDIUM</option>
                <option>HIGH</option>
                <option>CRITICAL</option>
              </select>
            </div>
          </div>
          {form.targetAudience === 'SPECIFIC_DEPARTMENT' && <div><label>Department</label><input required value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>}
          {form.targetAudience === 'SPECIFIC_ROLE' && <div><label>Role</label><select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}><option value="STUDENT">Student</option><option value="FACULTY">Faculty</option><option value="ADMIN">Admin</option><option value="SECURITY">Security</option></select></div>}
          {form.targetAudience === 'SPECIFIC_YEAR' && <div><label>Student year</label><select required value={form.targetYear} onChange={(e) => setForm({ ...form, targetYear: e.target.value })}><option value="">Select year</option>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>{year}</option>)}</select></div>}
          {form.targetAudience === 'SPECIFIC_GROUP' && <div><label>Group</label><input required maxLength={40} value={form.targetGroup} onChange={(e) => setForm({ ...form, targetGroup: e.target.value })} /></div>}
          <button className="btn-primary">Publish</button>
        </form>
      </Modal>
    </div>
  );
}
