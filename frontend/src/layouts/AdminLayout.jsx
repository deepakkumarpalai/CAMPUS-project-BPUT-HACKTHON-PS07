import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  ContactRound,
  FileText,
  GraduationCap,
  Home,
  IdCard,
  Megaphone,
  MessageSquareWarning,
  MessageCircle,
  ShieldCheck,
  Ticket,
  Users,
  WalletCards,
  Wrench
} from 'lucide-react';

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <Home size={16} /> },
  { to: '/admin/students', label: 'Students', icon: <GraduationCap size={16} /> },
  { to: '/admin/faculty', label: 'Faculty', icon: <Users size={16} /> },
  { to: '/admin/notices', label: 'Notices', icon: <Megaphone size={16} /> },
  { to: '/admin/events', label: 'Event Hub', icon: <CalendarDays size={16} /> },
  { to: '/admin/exams', label: 'Exams & Results', icon: <ClipboardList size={16} /> },
  { to: '/admin/attendance', label: 'Attendance', icon: <ClipboardCheck size={16} /> },
  { to: '/admin/complaints', label: 'Complaints', icon: <MessageSquareWarning size={16} /> },
  { to: '/admin/interactions', label: 'Campus Interaction', icon: <MessageCircle size={16} /> },
  { to: '/admin/payments', label: 'Payments', icon: <WalletCards size={16} /> },
  { to: '/admin/leave', label: 'Leave', icon: <FileText size={16} /> },
  { to: '/admin/certificates', label: 'Certificates', icon: <IdCard size={16} /> },
  { to: '/admin/gate-pass', label: 'Gate Pass', icon: <Ticket size={16} /> },
  { to: '/admin/visitors', label: 'Visitors', icon: <ContactRound size={16} /> },
  { to: '/admin/security-users', label: 'Security Accounts', icon: <ShieldCheck size={16} /> },
  { to: '/admin/services', label: 'Services', icon: <Wrench size={16} /> },
  { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
  { to: '/admin/audit-logs', label: 'Audit Log', icon: <FileText size={16} /> },
  { to: '/admin/notifications', label: 'Notifications', icon: <Bell size={16} /> }
];

export default function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar items={items} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="portal-main">{children}</main>
      </div>
    </div>
  );
}
