import { attendanceService } from '../../services/attendanceService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDate } from '../../utils/format.js';

export default function StudentAttendance() {
  const { data, loading, error } = useAsync(async () => (await attendanceService.summary()).data.data, []);
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Attendance</h2>
      <div className="card">
        <p className="text-sm text-slate-500">Overall attendance</p>
        <p className="text-3xl font-semibold">{data.overall || 0}%</p>
      </div>
      {!data.subjectWise?.length ? (
        <div className="card text-slate-500">No attendance records available.</div>
      ) : (
        <Table
          rows={data.subjectWise}
          columns={[
            { key: 'subject', label: 'Subject' },
            { key: 'present', label: 'Present / Late' },
            { key: 'total', label: 'Total' },
            { key: 'percentage', label: '%', render: (row) => `${row.percentage}%` }
          ]}
        />
      )}
      <Table
        empty="No attendance records available."
        rows={data.records || []}
        columns={[
          { key: 'subject', label: 'Subject' },
          { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }
        ]}
      />
    </div>
  );
}
