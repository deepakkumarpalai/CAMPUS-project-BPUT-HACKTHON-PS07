import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute.jsx';
import RoleRoute from '../components/RoleRoute.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { dashboardPath } from '../utils/format.js';
import StudentLayout from '../layouts/StudentLayout.jsx';
import FacultyLayout from '../layouts/FacultyLayout.jsx';
import AdminLayout from '../layouts/AdminLayout.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import StudentDashboard from '../pages/student/Dashboard.jsx';
import StudentProfile from '../pages/student/Profile.jsx';
import StudentNotices from '../pages/student/Notices.jsx';
import StudentAttendance from '../pages/student/Attendance.jsx';
import StudentLeave from '../pages/student/Leave.jsx';
import StudentComplaints from '../pages/student/Complaints.jsx';
import StudentCertificates from '../pages/student/Certificates.jsx';
import StudentGatePass from '../pages/student/GatePass.jsx';
import StudentServices from '../pages/student/Services.jsx';
import StudentNotifications from '../pages/student/Notifications.jsx';
import FacultyDashboard from '../pages/faculty/Dashboard.jsx';
import FacultyProfile from '../pages/faculty/Profile.jsx';
import FacultyNotices from '../pages/faculty/Notices.jsx';
import FacultyAttendance from '../pages/faculty/Attendance.jsx';
import FacultyLeave from '../pages/faculty/Leave.jsx';
import FacultyComplaints from '../pages/faculty/Complaints.jsx';
import FacultyServices from '../pages/faculty/Services.jsx';
import FacultyNotifications from '../pages/faculty/Notifications.jsx';
import AdminDashboard from '../pages/admin/Dashboard.jsx';
import AdminStudents from '../pages/admin/Students.jsx';
import AdminFaculty from '../pages/admin/Faculty.jsx';
import AdminNotices from '../pages/admin/Notices.jsx';
import AdminAttendance from '../pages/admin/Attendance.jsx';
import AdminComplaints from '../pages/admin/Complaints.jsx';
import AdminLeave from '../pages/admin/Leave.jsx';
import AdminCertificates from '../pages/admin/Certificates.jsx';
import AdminGatePass from '../pages/admin/GatePass.jsx';
import AdminServices from '../pages/admin/Services.jsx';
import AdminAnalytics from '../pages/admin/Analytics.jsx';
import AdminNotifications from '../pages/admin/Notifications.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EventHubPage from '../pages/shared/EventHubPage.jsx';
import ExamsPage from '../pages/shared/ExamsPage.jsx';
import InteractionsPage from '../pages/shared/InteractionsPage.jsx';
import PaymentsPage from '../pages/shared/PaymentsPage.jsx';
import VisitorRequest from '../pages/shared/VisitorRequest.jsx';
import AdminVisitors from '../pages/admin/Visitors.jsx';
import VisitorVerification from '../pages/security/VisitorVerification.jsx';
import SecurityLayout from '../layouts/SecurityLayout.jsx';
import SecurityUsers from '../pages/admin/SecurityUsers.jsx';
import AuditLogs from '../pages/admin/AuditLogs.jsx';

const StudentShell = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute roles={['STUDENT']}>
      <StudentLayout>{children}</StudentLayout>
    </RoleRoute>
  </ProtectedRoute>
);

const FacultyShell = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute roles={['FACULTY']}>
      <FacultyLayout>{children}</FacultyLayout>
    </RoleRoute>
  </ProtectedRoute>
);

const AdminShell = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute roles={['ADMIN']}>
      <AdminLayout>{children}</AdminLayout>
    </RoleRoute>
  </ProtectedRoute>
);

const SecurityShell = ({ children }) => (
  <ProtectedRoute>
    <RoleRoute roles={['SECURITY']}>
      <SecurityLayout>{children}</SecurityLayout>
    </RoleRoute>
  </ProtectedRoute>
);

function HomeRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={dashboardPath(user.role)} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/visitor/request" element={<VisitorRequest />} />
      <Route path="/security/visitors" element={<SecurityShell><VisitorVerification /></SecurityShell>} />

      <Route path="/student/dashboard" element={<StudentShell><StudentDashboard /></StudentShell>} />
      <Route path="/student/profile" element={<StudentShell><StudentProfile /></StudentShell>} />
      <Route path="/student/notices" element={<StudentShell><StudentNotices /></StudentShell>} />
      <Route path="/student/events" element={<StudentShell><EventHubPage /></StudentShell>} />
      <Route path="/student/exams" element={<StudentShell><ExamsPage /></StudentShell>} />
      <Route path="/student/interactions" element={<StudentShell><InteractionsPage /></StudentShell>} />
      <Route path="/student/payments" element={<StudentShell><PaymentsPage /></StudentShell>} />
      <Route path="/student/attendance" element={<StudentShell><StudentAttendance /></StudentShell>} />
      <Route path="/student/leave" element={<StudentShell><StudentLeave /></StudentShell>} />
      <Route path="/student/complaints" element={<StudentShell><StudentComplaints /></StudentShell>} />
      <Route path="/student/certificates" element={<StudentShell><StudentCertificates /></StudentShell>} />
      <Route path="/student/gate-pass" element={<StudentShell><StudentGatePass /></StudentShell>} />
      <Route path="/student/services" element={<StudentShell><StudentServices /></StudentShell>} />
      <Route path="/student/notifications" element={<StudentShell><StudentNotifications /></StudentShell>} />

      <Route path="/faculty/dashboard" element={<FacultyShell><FacultyDashboard /></FacultyShell>} />
      <Route path="/faculty/profile" element={<FacultyShell><FacultyProfile /></FacultyShell>} />
      <Route path="/faculty/notices" element={<FacultyShell><FacultyNotices /></FacultyShell>} />
      <Route path="/faculty/events" element={<FacultyShell><EventHubPage /></FacultyShell>} />
      <Route path="/faculty/exams" element={<FacultyShell><ExamsPage /></FacultyShell>} />
      <Route path="/faculty/interactions" element={<FacultyShell><InteractionsPage /></FacultyShell>} />
      <Route path="/faculty/attendance" element={<FacultyShell><FacultyAttendance /></FacultyShell>} />
      <Route path="/faculty/leave" element={<FacultyShell><FacultyLeave /></FacultyShell>} />
      <Route path="/faculty/complaints" element={<FacultyShell><FacultyComplaints /></FacultyShell>} />
      <Route path="/faculty/services" element={<FacultyShell><FacultyServices /></FacultyShell>} />
      <Route path="/faculty/notifications" element={<FacultyShell><FacultyNotifications /></FacultyShell>} />

      <Route path="/admin/dashboard" element={<AdminShell><AdminDashboard /></AdminShell>} />
      <Route path="/admin/students" element={<AdminShell><AdminStudents /></AdminShell>} />
      <Route path="/admin/faculty" element={<AdminShell><AdminFaculty /></AdminShell>} />
      <Route path="/admin/notices" element={<AdminShell><AdminNotices /></AdminShell>} />
      <Route path="/admin/events" element={<AdminShell><EventHubPage /></AdminShell>} />
      <Route path="/admin/exams" element={<AdminShell><ExamsPage /></AdminShell>} />
      <Route path="/admin/interactions" element={<AdminShell><InteractionsPage /></AdminShell>} />
      <Route path="/admin/payments" element={<AdminShell><PaymentsPage /></AdminShell>} />
      <Route path="/admin/attendance" element={<AdminShell><AdminAttendance /></AdminShell>} />
      <Route path="/admin/complaints" element={<AdminShell><AdminComplaints /></AdminShell>} />
      <Route path="/admin/leave" element={<AdminShell><AdminLeave /></AdminShell>} />
      <Route path="/admin/certificates" element={<AdminShell><AdminCertificates /></AdminShell>} />
      <Route path="/admin/gate-pass" element={<AdminShell><AdminGatePass /></AdminShell>} />
      <Route path="/admin/visitors" element={<AdminShell><AdminVisitors /></AdminShell>} />
      <Route path="/admin/security-users" element={<AdminShell><SecurityUsers /></AdminShell>} />
      <Route path="/admin/services" element={<AdminShell><AdminServices /></AdminShell>} />
      <Route path="/admin/analytics" element={<AdminShell><AdminAnalytics /></AdminShell>} />
      <Route path="/admin/audit-logs" element={<AdminShell><AuditLogs /></AdminShell>} />
      <Route path="/admin/notifications" element={<AdminShell><AdminNotifications /></AdminShell>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
