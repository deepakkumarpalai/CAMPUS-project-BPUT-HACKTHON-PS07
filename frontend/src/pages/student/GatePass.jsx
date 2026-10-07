import { useState } from 'react';
import { gatePassService } from '../../services/gatePassService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function GatePassPage({ canReview = false }) {
  const { push } = useToast();
  const { data, loading, error, reload } = useAsync(async () => (await gatePassService.list()).data.data, []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ destination: '', reason: '', departureDate: '', returnDate: '', emergencyContact: '' });

  const create = async (e) => {
    e.preventDefault();
    try {
      await gatePassService.create(form);
      push('Gate pass submitted', 'success');
      setOpen(false);
      reload();
    } catch (err) {
      push(err.userMessage || 'Submit failed', 'error');
    }
  };

  const review = async (id, status) => {
    await gatePassService.update(id, { status });
    push(`Gate pass ${status.toLowerCase()}`, 'success');
    reload();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gate pass</h2>
        {!canReview && <button className="btn-primary" type="button" onClick={() => setOpen(true)}>New gate pass</button>}
      </div>
      <Table
        empty="No gate pass requests found."
        rows={data || []}
        columns={[
          { key: 'student', label: 'Student', render: (row) => row.student?.name || 'You' },
          { key: 'destination', label: 'Destination' },
          { key: 'reason', label: 'Reason' },
          { key: 'departure', label: 'Departure', render: (row) => formatDate(row.departureDate) },
          { key: 'return', label: 'Return', render: (row) => formatDate(row.returnDate) },
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
      <Modal open={open} title="Gate pass request" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-3">
          <div>
            <label>Destination</label>
            <input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          </div>
          <div>
            <label>Reason</label>
            <textarea required rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label>Departure</label>
              <input type="datetime-local" required value={form.departureDate} onChange={(e) => setForm({ ...form, departureDate: e.target.value })} />
            </div>
            <div>
              <label>Return</label>
              <input type="datetime-local" required value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label>Emergency contact</label>
            <input required value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
          </div>
          <button className="btn-primary">Submit</button>
        </form>
      </Modal>
    </div>
  );
}
