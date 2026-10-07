import { notificationService } from '../../services/notificationService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import { formatDateTime } from '../../utils/format.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function NotificationsPage() {
  const { data, loading, error, reload } = useAsync(async () => (await notificationService.list()).data, []);
  const { push } = useToast();

  const markAll = async () => {
    try {
      await notificationService.markAllRead();
      window.dispatchEvent(new Event('campus-notifications-changed'));
      push('All notifications marked as read', 'success');
      reload();
    } catch (err) {
      push(err.userMessage || 'Failed', 'error');
    }
  };

  const markOne = async (id) => {
    try {
      await notificationService.markRead(id);
      window.dispatchEvent(new Event('campus-notifications-changed'));
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not mark notification as read', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  const items = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notifications {data?.unread ? `(${data.unread} unread)` : ''}</h2>
        <button className="btn-secondary" type="button" onClick={markAll}>
          Mark all read
        </button>
      </div>
      {!items.length ? (
        <div className="card text-slate-500">No notifications found.</div>
      ) : (
        items.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() => !item.isRead && markOne(item._id)}
            className={`card w-full text-left ${item.isRead ? 'opacity-70' : 'border-blue-200'}`}
          >
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-slate-600">{item.message}</p>
            <p className="mt-1 text-xs text-slate-400">{item.type} · {formatDateTime(item.createdAt)}</p>
          </button>
        ))
      )}
    </div>
  );
}
