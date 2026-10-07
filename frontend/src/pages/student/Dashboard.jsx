import { useAuth } from '../../context/AuthContext.jsx';
import { attendanceService } from '../../services/attendanceService';
import { noticeService } from '../../services/noticeService';
import { leaveService } from '../../services/leaveService';
import { complaintService } from '../../services/complaintService';
import { certificateService } from '../../services/certificateService';
import { gatePassService } from '../../services/gatePassService';
import { campusRequestService } from '../../services/campusRequestService';
import { useAsync } from '../../hooks/useAsync';
import DashboardCard from '../../components/DashboardCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { CalendarCheck, FileText, Megaphone, MessageSquareWarning } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(async () => {
    const [attendance, notices, leave, complaints, certificates, gate, services] = await Promise.all([
      attendanceService.summary(),
      noticeService.list(),
      leaveService.list(),
      complaintService.list(),
      certificateService.list(),
      gatePassService.list(),
      campusRequestService.list()
    ]);
    return {
      attendance: attendance.data.data,
      notices: notices.data.data || [],
      leave: leave.data.data || [],
      complaints: complaints.data.data || [],
      certificates: certificates.data.data || [],
      gate: gate.data.data || [],
      services: services.data.data || []
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  const pending = (list) => list.filter((item) => item.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-slate-500">Student portal · {user.department || 'Department not set'} · {user.studentId || 'No student ID'}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Attendance" value={`${data.attendance.overall || 0}%`} icon={<CalendarCheck size={20} />} tone="green" />
        <DashboardCard title="Pending leave" value={pending(data.leave)} icon={<FileText size={20} />} />
        <DashboardCard title="Open complaints" value={pending(data.complaints)} icon={<MessageSquareWarning size={20} />} tone="amber" />
        <DashboardCard title="Latest notices" value={data.notices.length} icon={<Megaphone size={20} />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold">Profile summary</h3>
          <p>{user.email}</p>
          <p className="text-sm text-slate-500">{user.phone || 'No phone on file'}</p>
        </div>
        <div className="card">
          <h3 className="mb-3 font-semibold">Latest notices</h3>
          {!data.notices.length && <p className="text-slate-500">No notices available.</p>}
          {data.notices.slice(0, 4).map((notice) => (
            <p key={notice._id} className="mb-2 text-sm">{notice.title}</p>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Leave', data.leave],
          ['Complaints', data.complaints],
          ['Certificates', data.certificates],
          ['Gate pass', data.gate],
          ['Services', data.services]
        ].map(([label, list]) => (
          <div key={label} className="card">
            <h3 className="mb-2 font-semibold">{label} status</h3>
            {!list.length ? (
              <p className="text-sm text-slate-500">No records yet.</p>
            ) : (
              list.slice(0, 3).map((item) => (
                <div key={item._id} className="mb-2 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{item.title || item.certificateType || item.leaveType || item.destination}</span>
                  <StatusBadge value={item.status} />
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
