import { useState } from 'react';
import { certificateService } from '../../services/certificateService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import Modal from '../../components/Modal.jsx';
import { formatDate } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function CertificatesPage({ canReview = false }) {
  const { push } = useToast();
  const { data, loading, error, reload } = useAsync(async () => (await certificateService.list()).data.data, []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ certificateType: 'BONAFIDE', reason: '' });

  const create = async (e) => {
    e.preventDefault();
    try {
      await certificateService.create(form);
      push('Certificate request submitted', 'success');
      setOpen(false);
      reload();
    } catch (err) {
      push(err.userMessage || 'Submit failed', 'error');
    }
  };

  const update = async (id, status) => {
    await certificateService.update(id, { status });
    push('Certificate updated', 'success');
    reload();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Certificate requests</h2>
        {!canReview && <button className="btn-primary" type="button" onClick={() => setOpen(true)}>New request</button>}
      </div>
      <Table
        empty="No certificate requests found."
        rows={data || []}
        columns={[
          { key: 'student', label: 'Student', render: (row) => row.student?.name || 'You' },
          { key: 'certificateType', label: 'Type' },
          { key: 'reason', label: 'Reason' },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'date', label: 'Date', render: (row) => formatDate(row.createdAt) },
          ...(canReview
            ? [{
                key: 'act',
                label: 'Action',
                render: (row) => (
                  <select value={row.status} onChange={(e) => update(row._id, e.target.value)}>
                    <option>PENDING</option>
                    <option>PROCESSING</option>
                    <option>READY</option>
                    <option>REJECTED</option>
                  </select>
                )
              }]
            : [])
        ]}
      />
      <Modal open={open} title="Certificate request" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-3">
          <div>
            <label>Type</label>
            <select value={form.certificateType} onChange={(e) => setForm({ ...form, certificateType: e.target.value })}>
              <option>BONAFIDE</option>
              <option>CHARACTER</option>
              <option>STUDY</option>
              <option>OTHER</option>
            </select>
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
