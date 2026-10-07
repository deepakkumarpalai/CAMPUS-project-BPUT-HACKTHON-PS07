import { complaintService } from '../../services/complaintService';
import { attendanceService } from '../../services/attendanceService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const COLORS = ['#1d4ed8', '#dc2626', '#f59e0b', '#059669', '#7c3aed', '#0f766e'];

export default function AdminAnalytics() {
  const { data, loading, error } = useAsync(async () => {
    const [analytics, attendance] = await Promise.all([complaintService.analytics(), attendanceService.list()]);
    return { analytics: analytics.data, attendance: attendance.data.data || [] };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  if (data.analytics.empty || !data.analytics.data) {
    return <div className="card text-slate-500">No data available</div>;
  }

  const charts = data.analytics.data;
  const present = data.attendance.filter((item) => item.status === 'PRESENT' || item.status === 'LATE').length;
  const attendanceOverview = data.attendance.length
    ? [
        { name: 'Present/Late', value: present },
        { name: 'Absent', value: data.attendance.length - present }
      ]
    : [];

  const ChartCard = ({ title, items }) => (
    <div className="card h-80">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {!items?.length ? (
        <p className="text-slate-500">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" hide={items.length > 6} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#1d4ed8" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Analytics</h2>
      <p className="text-sm text-slate-500">Average resolution time: {charts.averageResolutionHours} hours</p>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Complaints by category" items={charts.byCategory} />
        <ChartCard title="Complaints by priority" items={charts.byPriority} />
        <ChartCard title="Complaints by status" items={charts.byStatus} />
        <ChartCard title="Complaints by department" items={charts.byDepartment} />
        <ChartCard title="Complaints by location" items={charts.byLocation} />
        <ChartCard title="Requests over time" items={charts.requestsOverTime} />
        <div className="card h-80">
          <h3 className="mb-3 font-semibold">Resolved vs pending</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={charts.resolvedVsPending} dataKey="value" nameKey="name" outerRadius={90} label>
                {charts.resolvedVsPending.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card h-80">
          <h3 className="mb-3 font-semibold">Attendance overview</h3>
          {!attendanceOverview.length ? (
            <p className="text-slate-500">No attendance records available.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendanceOverview} dataKey="value" nameKey="name" outerRadius={90} label>
                  {attendanceOverview.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
