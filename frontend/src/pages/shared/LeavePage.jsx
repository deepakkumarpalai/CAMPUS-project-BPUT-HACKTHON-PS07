import { useState } from 'react';
import { leaveService } from '../../services/leaveService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function LeavePage({ canReview = false }) {
  const { push } = useToast();
  const { data, loading, error, reload } = useAsync(async () => (await leaveService.list()).data.data, []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ leaveType: 'CASUAL', fromDate: '', toDate: '', reason: '' });

  const create = async (e) => {
    e.preventDefault();
    try {
      await leaveService.create(form);
      push('Leave request submitted', 'success');
      setOpen(false);
      reload();
    } catch (err) {
      push(err.userMessage || 'Submit failed', 'error');
    }
  };

  const review = async (id, status) => {
    try {
      await leaveService.update(id, { status });
      push(`Leave ${status.toLowerCase()}`, 'success');
      reload();
    } catch (err) {
      push(err.userMessage || 'Update failed', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Leave requests</h2>
        {!canReview && <button className="btn-primary" type="button" onClick={() => setOpen(true)}>Apply for leave</button>}
      </div>
      <Table
        empty="No leave requests found."
        rows={data || []}
        columns={[
          { key: 'student', label: 'Student', render: (row) => row.student?.name || 'You' },
          { key: 'leaveType', label: 'Type' },
          { key: 'from', label: 'From', render: (row) => formatDate(row.fromDate) },
          { key: 'to', label: 'To', render: (row) => formatDate(row.toDate) },
          { key: 'reason', label: 'Reason' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          ...(canReview
            ? [{
                key: 'act',
                label: 'Action',
                render: (row) =>
                  row.status === 'PENDING' ? (
                    <div className="flex gap-2">
                      <button className="btn-primary" type="button" onClick={() => review(row._id, 'APPROVED')}>Approve</button>
                      <button className="btn-secondary" type="button" onClick={() => review(row._id, 'REJECTED')}>Reject</button>
                    </div>
                  ) : '—'
              }]
            : [])
        ]}
      />
      <Modal open={open} title="Leave request" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-3">
          <div>
            <label>Type</label>
            <select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
              <option>SICK</option>
              <option>CASUAL</option>
              <option>EMERGENCY</option>
              <option>ACADEMIC</option>
              <option>OTHER</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label>From</label>
              <input type="date" required value={form.fromDate} onChange={(e) => setForm({ ...form, fromDate: e.target.value })} />
            </div>
            <div>
              <label>To</label>
              <input type="date" required value={form.toDate} onChange={(e) => setForm({ ...form, toDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label>Reason</label>
            <textarea required rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <button className="btn-primary">Submit</button>
        </form>
      </Modal>
    </div>
  );
}
