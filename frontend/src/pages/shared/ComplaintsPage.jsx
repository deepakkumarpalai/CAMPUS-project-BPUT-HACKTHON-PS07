import { useState } from 'react';
import { complaintService } from '../../services/complaintService';
import { userService } from '../../services/userService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import { formatDate, formatDateTime } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ComplaintsPage({ mode = 'student' }) {
  const { user } = useAuth();
  const { push } = useToast();
  const canManage = mode === 'admin' || mode === 'faculty';
  const { data, loading, error, reload } = useAsync(async () => (await complaintService.list()).data.data, []);
  const staff = useAsync(async () => {
    if (!canManage) return [];
    return (await userService.list({ role: 'FACULTY' })).data.data.concat((await userService.list({ role: 'ADMIN' })).data.data);
  }, [canManage]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', description: '', location: '', category: 'OTHER' });
  const [review, setReview] = useState({ status: 'PENDING', finalPriority: 'MEDIUM', assignedTo: '', adminRemarks: '' });

  const create = async (e) => {
    e.preventDefault();
    try {
      await complaintService.create(form);
      push('Complaint submitted for review', 'success');
      setOpen(false);
      reload();
    } catch (err) {
      push(err.userMessage || 'Submit failed', 'error');
    }
  };

  const saveReview = async (e) => {
    e.preventDefault();
    try {
      await complaintService.update(selected._id, review);
      push('Complaint updated. AI recommendation was not applied automatically.', 'success');
      setSelected(null);
      reload();
    } catch (err) {
      push(err.userMessage || 'Update failed', 'error');
    }
  };

  const linkKeepSeparate = async (id, relatedId) => {
    await complaintService.update(id, { linkedComplaints: [...(selected.linkedComplaints || []).map((x) => x._id || x), relatedId] });
    push('Complaints linked. They were kept as separate records.', 'success');
    reload();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  const rows = (data || []).filter((item) =>
    `${item.title} ${item.location} ${item.category}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Complaints</h2>
        {mode !== 'admin' && (
          <button className="btn-primary" type="button" onClick={() => setOpen(true)}>
            New complaint
          </button>
        )}
      </div>
      <input placeholder="Search complaints" value={search} onChange={(e) => setSearch(e.target.value)} />
      <Table
        empty="No complaints found."
        rows={rows}
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'category', label: 'Category', render: (row) => row.category },
          { key: 'priority', label: 'Priority', render: (row) => <StatusBadge value={row.finalPriority || row.priority} /> },
          { key: 'ai', label: 'AI recommended', render: (row) => <StatusBadge value={row.aiRecommendedPriority} /> },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'department', label: 'Department' },
          { key: 'location', label: 'Location' },
          { key: 'sla', label: 'SLA', render: (row) => row.dueAt ? <span className={row.status !== 'RESOLVED' && row.status !== 'REJECTED' && new Date(row.dueAt) < new Date() ? 'font-semibold text-red-700' : 'text-slate-600'}>{formatDateTime(row.dueAt)}{row.escalationCount > 0 ? ` · ${row.escalationCount} escalations` : ''}</span> : '—' },
          { key: 'recurrence', label: 'Recurring', render: (row) => row.isRecurring ? <span className="font-medium text-amber-700">{row.recurrenceCount} reports / 14d</span> : '—' },
          { key: 'date', label: 'Submitted', render: (row) => formatDate(row.createdAt) },
          { key: 'assigned', label: 'Assigned', render: (row) => row.assignedTo?.name || '—' },
          ...(canManage
            ? [{ key: 'act', label: 'Action', render: (row) => <button className="btn-secondary" type="button" onClick={() => { setSelected(row); setReview({ status: row.status, finalPriority: row.finalPriority || row.priority, assignedTo: row.assignedTo?._id || '', adminRemarks: row.adminRemarks || '' }); }}>Review</button> }]
            : [])
        ]}
      />

      <Modal open={open} title="Submit complaint" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-3">
          <div>
            <label>Title</label>
            <input required minLength={5} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label>Description</label>
            <textarea required minLength={10} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label>Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <p className="text-xs text-slate-500">AI will recommend category and priority. Administrators review before any workflow decision.</p>
          <button className="btn-primary">Submit</button>
        </form>
      </Modal>

      <Modal open={Boolean(selected)} title="Complaint review" onClose={() => setSelected(null)}>
        {selected && (
          <form onSubmit={saveReview} className="space-y-3">
            <p className="text-sm text-slate-600">{selected.description}</p>
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium">
                {selected.aiAnalysis?.analysisMode === 'AI' ? 'AI Analysis' : 'Rule-Based Analysis'}
              </p>
              <p>Summary: {selected.aiAnalysis?.summary || '—'}</p>
              <p>Reason: {selected.priorityReason || selected.aiAnalysis?.reason}</p>
              <p>Keywords: {(selected.aiAnalysis?.keywords || []).join(', ') || '—'}</p>
              <p>SLA due: {formatDateTime(selected.dueAt)} · Escalations: {selected.escalationCount || 0}</p>
              {selected.isRecurring && <p className="mt-2 font-medium text-amber-700">Recurring issue: {selected.recurrenceCount} reports at this location in 14 days.</p>}
              {selected.aiAnalysis?.possibleDuplicate && (
                <p className="mt-2 font-medium text-amber-700">Possible related complaint found.</p>
              )}
              {(selected.aiAnalysis?.relatedItems || []).map((item) => (
                <div key={item.id} className="mt-2 flex items-center justify-between text-xs">
                  <span>{item.title} ({Math.round((item.similarity || 0) * 100)}%)</span>
                  <button type="button" className="btn-secondary" onClick={() => linkKeepSeparate(selected._id, item.id)}>
                    Link / keep separate
                  </button>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label>Status</label>
                <select value={review.status} onChange={(e) => setReview({ ...review, status: e.target.value })}>
                  <option>PENDING</option>
                  <option>ASSIGNED</option>
                  <option>IN_PROGRESS</option>
                  <option>RESOLVED</option>
                  <option>REJECTED</option>
                </select>
              </div>
              <div>
                <label>Final priority (editable)</label>
                <select value={review.finalPriority} onChange={(e) => setReview({ ...review, finalPriority: e.target.value, priority: e.target.value })}>
                  <option>CRITICAL</option>
                  <option>HIGH</option>
                  <option>MEDIUM</option>
                  <option>LOW</option>
                </select>
              </div>
            </div>
            <div>
              <label>Assign to</label>
              <select value={review.assignedTo} onChange={(e) => setReview({ ...review, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {(staff.data || []).map((person) => (
                  <option key={person._id} value={person._id}>{person.name} ({person.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label>Admin remarks</label>
              <textarea rows={3} value={review.adminRemarks} onChange={(e) => setReview({ ...review, adminRemarks: e.target.value })} />
            </div>
            <p className="text-xs text-slate-500">AI never auto-rejects or auto-resolves complaints. {user.name} remains the decision maker.</p>
            <button className="btn-primary">Save review</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
