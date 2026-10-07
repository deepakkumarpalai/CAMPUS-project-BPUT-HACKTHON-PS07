import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import {
  Bell,
  CalendarDays,
  ClipboardList,
  FileCheck,
  FileText,
  Home,
  IdCard,
  Megaphone,
  MessageCircle,
  MessageSquareWarning,
  Ticket,
  UserRound,
  WalletCards,
  Wrench
} from 'lucide-react';

const items = [
  { to: '/student/dashboard', label: 'Dashboard', icon: <Home size={16} /> },
  { to: '/student/profile', label: 'Profile', icon: <UserRound size={16} /> },
  { to: '/student/notices', label: 'Notices', icon: <Megaphone size={16} /> },
  { to: '/student/events', label: 'Event Hub', icon: <CalendarDays size={16} /> },
  { to: '/student/exams', label: 'Exams & Results', icon: <ClipboardList size={16} /> },
  { to: '/student/attendance', label: 'Attendance', icon: <FileCheck size={16} /> },
  { to: '/student/leave', label: 'Leave', icon: <FileText size={16} /> },
  { to: '/student/complaints', label: 'Complaints', icon: <MessageSquareWarning size={16} /> },
  { to: '/student/interactions', label: 'Campus Interaction', icon: <MessageCircle size={16} /> },
  { to: '/student/payments', label: 'Payments', icon: <WalletCards size={16} /> },
  { to: '/student/certificates', label: 'Certificates', icon: <IdCard size={16} /> },
  { to: '/student/gate-pass', label: 'Gate Pass', icon: <Ticket size={16} /> },
  { to: '/student/services', label: 'Services', icon: <Wrench size={16} /> },
  { to: '/student/notifications', label: 'Notifications', icon: <Bell size={16} /> }
];

export default function StudentLayout({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar items={items} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
