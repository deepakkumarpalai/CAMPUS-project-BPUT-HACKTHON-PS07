import { userService } from '../../services/userService';
import { useAsync } from '../../hooks/useAsync';
import DashboardCard from '../../components/DashboardCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { AlertTriangle, FileText, GraduationCap, MessageSquareWarning, Users } from 'lucide-react';

export default function AdminDashboard() {
  const { data, loading, error } = useAsync(async () => (await userService.dashboard()).data.data, []);
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  const cards = [
    ['Total students', data.totalStudents, <GraduationCap size={20} />, 'blue'],
    ['Total faculty', data.totalFaculty, <Users size={20} />, 'slate'],
    ['Total complaints', data.totalComplaints, <MessageSquareWarning size={20} />, 'blue'],
    ['Critical complaints', data.criticalComplaints, <AlertTriangle size={20} />, 'red'],
    ['High priority', data.highPriorityComplaints, <AlertTriangle size={20} />, 'amber'],
    ['Pending complaints', data.pendingComplaints, <MessageSquareWarning size={20} />, 'amber'],
    ['Resolved complaints', data.resolvedComplaints, <MessageSquareWarning size={20} />, 'green'],
    ['Pending leave', data.pendingLeave, <FileText size={20} />, 'amber'],
    ['Pending certificates', data.pendingCertificates, <FileText size={20} />, 'blue'],
    ['Pending gate passes', data.pendingGatePass, <FileText size={20} />, 'blue'],
    ['Total notices', data.totalNotices, <FileText size={20} />, 'slate'],
    ['Service requests', data.serviceRequests, <FileText size={20} />, 'blue']
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Administrator dashboard</h1>
        <p className="text-slate-500">Operational overview of campus services. AI recommendations never auto-close requests.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value, icon, tone]) => (
          <DashboardCard key={title} title={title} value={value} icon={icon} tone={tone} />
        ))}
      </div>
    </div>
  );
}
