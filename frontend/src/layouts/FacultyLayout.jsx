import { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import { Bell, CalendarDays, ClipboardCheck, ClipboardList, FileText, Home, Megaphone, MessageCircle, MessageSquareWarning, UserRound, Wrench } from 'lucide-react';

const items = [
  { to: '/faculty/dashboard', label: 'Dashboard', icon: <Home size={16} /> },
  { to: '/faculty/profile', label: 'Profile', icon: <UserRound size={16} /> },
  { to: '/faculty/notices', label: 'Notices', icon: <Megaphone size={16} /> },
  { to: '/faculty/events', label: 'Event Hub', icon: <CalendarDays size={16} /> },
  { to: '/faculty/exams', label: 'Exams', icon: <ClipboardList size={16} /> },
  { to: '/faculty/attendance', label: 'Attendance', icon: <ClipboardCheck size={16} /> },
  { to: '/faculty/leave', label: 'Leave', icon: <FileText size={16} /> },
  { to: '/faculty/complaints', label: 'Complaints', icon: <MessageSquareWarning size={16} /> },
  { to: '/faculty/interactions', label: 'Campus Interaction', icon: <MessageCircle size={16} /> },
  { to: '/faculty/services', label: 'Services', icon: <Wrench size={16} /> },
  { to: '/faculty/notifications', label: 'Notifications', icon: <Bell size={16} /> }
];

export default function FacultyLayout({ children }) {
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
