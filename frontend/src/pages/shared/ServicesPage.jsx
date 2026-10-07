import { useState } from 'react';
import { campusRequestService } from '../../services/campusRequestService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

const categories = ['Electrical', 'Water', 'Cleaning', 'IT Support', 'Furniture', 'Classroom', 'Hostel', 'Library', 'Transport', 'Other'];

export default function ServicesPage({ canManage = false }) {
  const { push } = useToast();
  const { data, loading, error, reload } = useAsync(async () => (await campusRequestService.list()).data.data, []);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'Other', location: '' });
  const [review, setReview] = useState({ status: 'PENDING', priority: 'MEDIUM', adminRemarks: '' });

  const create = async (e) => {
    e.preventDefault();
    try {
      await campusRequestService.create(form);
      push('Service request submitted', 'success');
      setOpen(false);
      reload();
    } catch (err) {
      push(err.userMessage || 'Submit failed', 'error');
    }
  };

  const save = async (e) => {
    e.preventDefault();
    await campusRequestService.update(selected._id, review);
    push('Request updated', 'success');
    setSelected(null);
    reload();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Campus service requests</h2>
        {!canManage && (
          <button className="btn-primary" type="button" onClick={() => setOpen(true)}>New request</button>
        )}
        {canManage && (
          <button className="btn-primary" type="button" onClick={() => setOpen(true)}>New request</button>
        )}
      </div>
      <Table
        empty="No campus service requests found."
        rows={data || []}
        columns={[
          { key: 'title', label: 'Title' },
          { key: 'category', label: 'Category' },
          { key: 'priority', label: 'Priority', render: (row) => <StatusBadge value={row.finalPriority || row.priority} /> },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'location', label: 'Location' },
          { key: 'date', label: 'Date', render: (row) => formatDate(row.createdAt) },
          ...(canManage
            ? [{ key: 'act', label: 'Action', render: (row) => <button className="btn-secondary" type="button" onClick={() => { setSelected(row); setReview({ status: row.status, priority: row.priority, adminRemarks: row.adminRemarks || '' }); }}>Manage</button> }]
            : [])
        ]}
      />

      <Modal open={open} title="New campus service request" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-3">
          <div>
            <label>Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label>Description</label>
            <textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label>Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <button className="btn-primary">Submit</button>
        </form>
      </Modal>

      <Modal open={Boolean(selected)} title="Review service request" onClose={() => setSelected(null)}>
        {selected && (
          <form onSubmit={save} className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium">{selected.aiAnalysis?.analysisMode === 'AI' ? 'AI Analysis' : 'Rule-Based Analysis'}</p>
              <p>{selected.aiAnalysis?.summary || selected.description}</p>
            </div>
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
              <label>Priority</label>
              <select value={review.priority} onChange={(e) => setReview({ ...review, priority: e.target.value, finalPriority: e.target.value })}>
                <option>CRITICAL</option>
                <option>HIGH</option>
                <option>MEDIUM</option>
                <option>LOW</option>
              </select>
            </div>
            <div>
              <label>Remarks</label>
              <textarea rows={3} value={review.adminRemarks} onChange={(e) => setReview({ ...review, adminRemarks: e.target.value })} />
            </div>
            <button className="btn-primary">Save</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
