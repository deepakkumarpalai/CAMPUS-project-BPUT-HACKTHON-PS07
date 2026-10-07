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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 lg:hidden" onClick={onMenu} type="button">
          <Menu size={20} />
        </button>
        <div>
          <p className="text-sm font-semibold text-blue-800">Smart Campus</p>
          <p className="text-xs text-slate-500">Unified Information & Service Platform</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link
          to={notificationsPath}
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          title={unread ? `${unread} unread notifications` : 'Notifications'}
        >
          <Bell size={18} />
          {unread > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">{unread > 99 ? '99+' : unread}</span>}
        </Link>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs uppercase text-slate-500">{user?.role}</p>
        </div>
        <button className="btn-secondary" type="button" onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
}
