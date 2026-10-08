import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import { auditService } from '../../services/auditService';
import { formatDateTime } from '../../utils/format.js';

export default function AuditLogs() {
  const { data, loading, error } = useAsync(async () => (await auditService.list({ limit: 100 })).data.data, []);
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <header><h1 className="text-xl font-semibold">Audit log</h1><p className="text-sm text-slate-600">Recent administrative and security-sensitive actions.</p></header>
      <Table empty="No audit events have been recorded." rows={data || []} columns={[
        { key: 'time', label: 'Time', render: (row) => formatDateTime(row.createdAt) },
        { key: 'actor', label: 'Actor', render: (row) => row.actor ? `${row.actor.name} (${row.actor.role})` : 'Unknown account' },
        { key: 'action', label: 'Action' },
        { key: 'entity', label: 'Record', render: (row) => `${row.entityType} · ${row.entityId}` },
        { key: 'details', label: 'Details' }
      ]} />
    </div>
  );
}