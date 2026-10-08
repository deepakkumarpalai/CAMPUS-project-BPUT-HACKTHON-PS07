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

const CATEGORY_LABELS = {
  ACADEMIC: 'Classroom & Laboratory',
  HOSTEL: 'Hostel',
  MESS: 'Mess & Food',
  ELECTRICAL: 'Electrical',
  WATER: 'Water Supply',
  CLEANLINESS: 'Bathroom & Cleaning',
  SECURITY: 'Security',
  IT: 'Wi-Fi & Internet',
  TRANSPORT: 'Transport',
  LIBRARY: 'Library',
  MAINTENANCE: 'Maintenance',
  ADMINISTRATION: 'Administration',
  OTHER: 'Other'
};

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
  const [priorityOverrideChanged, setPriorityOverrideChanged] = useState(false);
  const [priorityOverrideOpen, setPriorityOverrideOpen] = useState(false);
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
      const { finalPriority, ...workflowReview } = review;
      const payload = mode === 'admin' && priorityOverrideChanged
        ? { ...workflowReview, finalPriority, priority: finalPriority }
        : workflowReview;
      await complaintService.update(selected._id, payload);
      push(priorityOverrideChanged ? 'Complaint updated with an administrator priority override.' : 'Complaint review saved.', 'success');
      setSelected(null);
      setPriorityOverrideOpen(false);
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
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">{mode === 'admin' ? 'AI-assisted recommendations' : 'Campus support'}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{mode === 'admin' ? 'Complaint priority' : 'Complaints'}</h2>
        </div>
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
          { key: 'category', label: 'Category', render: (row) => CATEGORY_LABELS[row.category] || row.category },
          { key: 'priority', label: 'Priority', render: (row) => <StatusBadge value={row.finalPriority || row.priority} /> },
          { key: 'ai', label: 'AI recommendation', render: (row) => <div className="space-y-1"><StatusBadge value={row.aiRecommendedPriority} /><p className="text-[10px] text-slate-500">{row.prioritySource === 'ADMIN' ? 'Admin override' : row.aiAnalysis?.analysisMode === 'ML_NLP' ? 'AI suggested' : 'Existing fallback'}</p></div> },
          { key: 'score', label: 'Score', render: (row) => Number.isFinite(row.priorityScore) ? <span className="font-semibold tabular-nums">{row.priorityScore}/100</span> : '—' },
          { key: 'reason', label: 'AI reason', render: (row) => <span className="block max-w-xs text-xs leading-5 text-slate-600">{row.priorityReason || 'Not available'}</span> },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'department', label: 'Department' },
          { key: 'location', label: 'Location' },
          { key: 'sla', label: 'SLA', render: (row) => row.dueAt ? <span className={row.status !== 'RESOLVED' && row.status !== 'REJECTED' && new Date(row.dueAt) < new Date() ? 'font-semibold text-red-700' : 'text-slate-600'}>{formatDateTime(row.dueAt)}{row.escalationCount > 0 ? ` · ${row.escalationCount} escalations` : ''}</span> : '—' },
          { key: 'recurrence', label: 'Recurring', render: (row) => row.isRecurring ? <span className="font-medium text-amber-700">{row.recurrenceCount} reports / 14d</span> : '—' },
          { key: 'date', label: 'Submitted', render: (row) => formatDate(row.createdAt) },
          { key: 'assigned', label: 'Assigned', render: (row) => row.assignedTo?.name || '—' },
          ...(canManage
            ? [{ key: 'act', label: 'Action', render: (row) => <button className="btn-secondary" type="button" onClick={() => { setSelected(row); setPriorityOverrideChanged(false); setPriorityOverrideOpen(false); setReview({ status: row.status, finalPriority: row.finalPriority || row.priority, assignedTo: row.assignedTo?._id || '', adminRemarks: row.adminRemarks || '' }); }}>Review</button> }]
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
              <p className="font-semibold text-slate-900">AI-Assisted Complaint Priority Recommendation</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                {selected.aiAnalysis?.analysisMode === 'ML_NLP' ? 'TF-IDF + Logistic Regression' : selected.aiAnalysis?.analysisMode === 'AI' ? 'External AI analysis' : 'Existing rule-based analysis'}
              </p>
              <p>Summary: {selected.aiAnalysis?.summary || '—'}</p>
              <p>Reason: {selected.priorityReason || selected.aiAnalysis?.reason}</p>
              <p>Severity: {selected.aiSeverity || selected.aiAnalysis?.severity || 'Not scored'} · Urgency: {selected.aiUrgency || selected.aiAnalysis?.urgency || 'Not scored'}</p>
              <p>Potentially affected: {selected.affectedPeople || selected.aiAnalysis?.affectedPeople || 'Not estimated'} · Priority score: {Number.isFinite(selected.priorityScore) ? `${selected.priorityScore}/100` : 'Not scored'}</p>
              <p>AI priority: {selected.aiRecommendedPriority || 'Not available'} · Current priority: {selected.finalPriority || selected.priority} ({selected.prioritySource || 'AI'})</p>
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
              {mode === 'admin' && <div className="sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">AI priority</p>
                    <div className="mt-2"><StatusBadge value={selected.aiRecommendedPriority || selected.priority} /></div>
                    <p className="mt-2 text-xs text-slate-500">Current source: {selected.prioritySource || 'AI'}</p>
                  </div>
                  <button className="btn-secondary" type="button" onClick={() => {
                    if (priorityOverrideOpen) {
                      setPriorityOverrideChanged(false);
                      setReview({ ...review, finalPriority: selected.finalPriority || selected.priority });
                    }
                    setPriorityOverrideOpen(!priorityOverrideOpen);
                  }}>
                    {priorityOverrideOpen ? 'Cancel priority change' : 'Change Priority'}
                  </button>
                </div>
                {priorityOverrideOpen && <div className="mt-3">
                  <label htmlFor="admin-priority-override">Admin override</label>
                  <select id="admin-priority-override" value={review.finalPriority} onChange={(e) => { setPriorityOverrideChanged(true); setReview({ ...review, finalPriority: e.target.value }); }}>
                    <option>CRITICAL</option>
                    <option>HIGH</option>
                    <option>MEDIUM</option>
                    <option>LOW</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    The AI suggestion remains unchanged. Saving your selection stores the current priority source as ADMIN.
                  </p>
                </div>}
              </div>}
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
            <p className="text-xs leading-5 text-slate-500">AI priority is a recommendation and may be wrong. {user.name} makes the final decision; the system never automatically rejects or resolves a complaint.</p>
            <button className="btn-primary">Save review</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
