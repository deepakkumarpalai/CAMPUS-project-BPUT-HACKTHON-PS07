import { useEffect, useState } from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { notificationService } from '../services/notificationService';

export default function Navbar({ onMenu }) {
  const { user, logout, token } = useAuth();
  const [unread, setUnread] = useState(0);
  const notificationsPath =
    user?.role === 'ADMIN' ? '/admin/notifications' : user?.role === 'FACULTY' ? '/faculty/notifications' : '/student/notifications';

  useEffect(() => {
    let active = true;
    const refreshUnread = async () => {
      try {
        const { data } = await notificationService.unreadCount();
        if (active) setUnread(data.unread || 0);
      } catch (error) {
        if (active) console.error('Failed to refresh unread notification count.', error);
      }
    };
    if (token) {
      refreshUnread();
      const timer = window.setInterval(refreshUnread, 30000);
      window.addEventListener('campus-notifications-changed', refreshUnread);
      return () => {
        active = false;
        window.clearInterval(timer);
        window.removeEventListener('campus-notifications-changed', refreshUnread);
      };
    }
    setUnread(0);
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between border-b border-slate-200/80 bg-[#fbfaf7]/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 text-slate-600 transition hover:bg-white hover:text-slate-950 lg:hidden" aria-label="Open navigation menu" onClick={onMenu} type="button">
          <Menu size={20} />
        </button>
        <div className="hidden sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">Campus portal</p>
          <p className="mt-0.5 text-sm font-medium text-slate-500">Your day, all in one place</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/home" className="hidden text-sm font-medium text-slate-600 transition hover:text-amber-800 lg:block">College website</Link>
        <Link
          to={notificationsPath}
          className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-950"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          title={unread ? `${unread} unread notifications` : 'Notifications'}
        >
          <Bell size={18} />
          {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">{unread > 99 ? '99+' : unread}</span>}
        </Link>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.15em] text-slate-500">{user?.role}</p>
        </div>
        <button className="btn-secondary !rounded-xl !px-3 !py-2.5" type="button" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
}
