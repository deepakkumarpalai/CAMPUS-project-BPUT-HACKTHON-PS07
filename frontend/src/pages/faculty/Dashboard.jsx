import { useAuth } from '../../context/AuthContext.jsx';
import { attendanceService } from '../../services/attendanceService';
import { noticeService } from '../../services/noticeService';
import { leaveService } from '../../services/leaveService';
import { complaintService } from '../../services/complaintService';
import { campusRequestService } from '../../services/campusRequestService';
import { useAsync } from '../../hooks/useAsync';
import DashboardCard from '../../components/DashboardCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { BookOpen, ClipboardCheck, FileText, MessageSquareWarning } from 'lucide-react';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useAsync(async () => {
    const [attendance, notices, leave, complaints, services] = await Promise.all([
      attendanceService.list(),
      noticeService.list(),
      leaveService.list({ status: 'PENDING' }),
      complaintService.list(),
      campusRequestService.list()
    ]);
    return {
      attendance: attendance.data.data || [],
      notices: notices.data.data || [],
      leave: leave.data.data || [],
      complaints: complaints.data.data || [],
      services: services.data.data || []
    };
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-slate-500">Faculty portal · {user.facultyId || 'No faculty ID'}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Assigned courses" value={(user.courses || []).length} icon={<BookOpen size={20} />} />
        <DashboardCard title="Attendance records" value={data.attendance.length} icon={<ClipboardCheck size={20} />} />
        <DashboardCard title="Pending leave" value={data.leave.length} icon={<FileText size={20} />} tone="amber" />
        <DashboardCard title="Complaints visible" value={data.complaints.length} icon={<MessageSquareWarning size={20} />} />
      </div>
      <div className="card">
        <h3 className="mb-2 font-semibold">Assigned courses</h3>
        {!(user.courses || []).length ? <p className="text-slate-500">No courses assigned.</p> : user.courses.map((course) => <p key={course}>{course}</p>)}
      </div>
      <div className="card">
        <h3 className="mb-2 font-semibold">Notices</h3>
        {!data.notices.length && <p className="text-slate-500">No notices available.</p>}
        {data.notices.slice(0, 5).map((notice) => (
          <p key={notice._id} className="text-sm">{notice.title}</p>
        ))}
      </div>
    </div>
  );
}
