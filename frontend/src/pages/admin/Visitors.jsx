import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { visitorService } from '../../services/visitorService';
import { formatDateTime } from '../../utils/format.js';

export default function AdminVisitors() {
  const { push } = useToast();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(async () => (await visitorService.list()).data.data, [refreshKey]);

  const decide = async (id, status) => {
    try {
      await visitorService.decide(id, status);
      push(`Visitor request ${status.toLowerCase()}`, 'success');
      setRefreshKey((value) => value + 1);
    } catch (requestError) {
      push(requestError.userMessage || 'Could not update visitor request.', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold">Visitor requests</h1><p className="text-sm text-slate-600">Review scheduled visits and issue QR passes to approved visitors.</p></div>
      <Table
        empty="No visitor requests found."
        rows={data || []}
        columns={[
          { key: 'visitor', label: 'Visitor', render: (row) => <div><p className="font-medium">{row.visitorName}</p><p className="text-xs text-slate-500">{row.email} · {row.phone}</p></div> },
          { key: 'host', label: 'Host', render: (row) => row.hostName },
          { key: 'visit', label: 'Visit time', render: (row) => <div>{formatDateTime(row.visitStart)}<br />to {formatDateTime(row.visitEnd)}</div> },
          { key: 'purpose', label: 'Purpose', render: (row) => row.purpose },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'actions', label: 'Review', render: (row) => row.status === 'PENDING' ? <div className="flex gap-2"><button className="btn-primary" type="button" onClick={() => decide(row._id, 'APPROVED')}>Approve</button><button className="btn-secondary" type="button" onClick={() => decide(row._id, 'REJECTED')}>Reject</button></div> : '—' }
        ]}
      />
    </div>
  );
}