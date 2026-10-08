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
      <section className="grid gap-3 sm:grid-cols-2" aria-label="Campus service signals">
        <div className="border-l-4 border-blue-600 bg-white p-4">
          <p className="text-sm text-slate-500">Complaints, last 7 days</p>
          <p className="text-2xl font-semibold">{charts.complaintsThisWeek ?? 0}</p>
          <p className="text-xs text-slate-500">{charts.weeklyChangePercent === null ? 'No complaints in the previous 7 days' : `${charts.weeklyChangePercent > 0 ? '+' : ''}${charts.weeklyChangePercent}% vs previous 7 days`}</p>
        </div>
        <div className="border-l-4 border-teal-600 bg-white p-4">
          <p className="text-sm text-slate-500">Busiest location, last 7 days</p>
          <p className="text-lg font-semibold">{charts.busiestLocationThisWeek?.location || 'No location reported'}</p>
          {charts.busiestLocationThisWeek && <p className="text-xs text-slate-500">{charts.busiestLocationThisWeek.count} complaints</p>}
        </div>
        <div className="border-l-4 border-red-600 bg-white p-4">
          <p className="text-sm text-slate-500">Open complaints past SLA</p>
          <p className="text-2xl font-semibold">{charts.overdueOpenComplaints ?? 0}</p>
        </div>
        <div className="border-l-4 border-amber-500 bg-white p-4">
          <p className="text-sm text-slate-500">Recurring locations (14 days)</p>
          <p className="text-2xl font-semibold">{charts.recurringIssues?.length ?? 0}</p>
        </div>
      </section>
      {!!charts.recurringIssues?.length && (
        <section className="space-y-2 border-y border-slate-200 py-4">
          <h3 className="font-semibold">Recurring issues to review</h3>
          {charts.recurringIssues.map((issue) => <p key={`${issue.category}-${issue.location}`} className="text-sm">{issue.category} · {issue.location}: {issue.count} reports in 14 days</p>)}
        </section>
      )}
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
