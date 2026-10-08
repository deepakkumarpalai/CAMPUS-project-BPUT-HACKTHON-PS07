import { userService } from '../../services/userService';
import { useAsync } from '../../hooks/useAsync';
import DashboardCard from '../../components/DashboardCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { AlertTriangle, FileText, GraduationCap, MessageSquareWarning, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/StatusBadge.jsx';
import { complaintService } from '../../services/complaintService';
import LatestComplaints from '../../components/LatestComplaints.jsx';

export default function AdminDashboard() {
  const { data, loading, error } = useAsync(async () => {
    const [dashboard, complaints] = await Promise.all([
      userService.dashboard(),
      complaintService.list()
    ]);
    return {
      dashboard: dashboard.data.data,
      complaints: complaints.data.data || []
    };
  }, []);
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  const complaintRows = data.complaints;
  const openComplaints = complaintRows.filter((item) => !['RESOLVED', 'REJECTED'].includes(item.status));
  const firstAction = openComplaints[0];
  const complaintMetrics = [
    ['Total complaints', complaintRows.length, <MessageSquareWarning size={20} />, 'slate'],
    ['Critical complaints', complaintRows.filter((item) => (item.finalPriority || item.priority) === 'CRITICAL').length, <AlertTriangle size={20} />, 'red'],
    ['High priority', complaintRows.filter((item) => (item.finalPriority || item.priority) === 'HIGH').length, <AlertTriangle size={20} />, 'amber'],
    ['Medium priority', complaintRows.filter((item) => (item.finalPriority || item.priority) === 'MEDIUM').length, <MessageSquareWarning size={20} />, 'blue'],
    ['Low priority', complaintRows.filter((item) => (item.finalPriority || item.priority) === 'LOW').length, <MessageSquareWarning size={20} />, 'green'],
    ['Resolved complaints', complaintRows.filter((item) => item.status === 'RESOLVED').length, <MessageSquareWarning size={20} />, 'green']
  ];

  const cards = [
    ['Total students', data.dashboard.totalStudents, <GraduationCap size={20} />, 'blue'],
    ['Total faculty', data.dashboard.totalFaculty, <Users size={20} />, 'slate'],
    ['Pending leave', data.dashboard.pendingLeave, <FileText size={20} />, 'amber'],
    ['Pending certificates', data.dashboard.pendingCertificates, <FileText size={20} />, 'blue'],
    ['Pending gate passes', data.dashboard.pendingGatePass, <FileText size={20} />, 'blue'],
    ['Total notices', data.dashboard.totalNotices, <FileText size={20} />, 'slate'],
    ['Service requests', data.dashboard.serviceRequests, <FileText size={20} />, 'blue']
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administrator dashboard</h1>
        <p className="text-slate-500">Operational overview of campus services. AI recommendations never auto-close requests.</p>
      </div>
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">AI-assisted recommendations</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">AI Priority Dashboard</h2>
          </div>
          <Link to="/admin/complaints" className="btn-secondary">Review complaints</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {complaintMetrics.map(([title, value, icon, tone]) => (
            <DashboardCard key={title} title={title} value={value} icon={icon} tone={tone} />
          ))}
        </div>
        <div className="card border-amber-200 bg-amber-50/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">AI recommended action · administrator review required</p>
          {firstAction ? (
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">Review “{firstAction.title}” first</p>
                  <StatusBadge value={firstAction.finalPriority || firstAction.priority} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {firstAction.priorityReason || 'Review the highest-ranked open complaint and confirm its impact.'}
                </p>
                {firstAction.prioritySource === 'ADMIN' && (
                  <p className="mt-2 text-xs font-medium text-slate-500">Current priority was set by an administrator; AI priority remains a recommendation.</p>
                )}
              </div>
              <Link to="/admin/complaints" className="text-sm font-semibold text-amber-900 hover:text-amber-700">Open priority list →</Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No open complaints need review right now.</p>
          )}
          <p className="mt-4 border-t border-amber-200 pt-3 text-xs leading-5 text-slate-500">
            AI output can be incorrect or incomplete. The administrator makes the final priority and workflow decision.
          </p>
        </div>
      </section>
      <LatestComplaints complaints={complaintRows} to="/admin/complaints" />
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Campus operations</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(([title, value, icon, tone]) => (
            <DashboardCard key={title} title={title} value={value} icon={icon} tone={tone} />
          ))}
        </div>
      </div>
    </div>
  );
}
