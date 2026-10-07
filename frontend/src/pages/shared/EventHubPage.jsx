import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync';
import { eventService } from '../../services/eventService';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Modal from '../../components/Modal.jsx';
import { formatDateTime } from '../../utils/format.js';

const emptyForm = {
  title: '',
  description: '',
  kind: 'EVENT',
  startsAt: '',
  endsAt: '',
  location: ''
};

const localDateTime = (value) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function EventHubPage() {
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN';
  const { data, loading, error, reload } = useAsync(async () => (await eventService.list()).data.data, []);
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openForm = (event = null) => {
    setEditing(event);
    setForm(event ? {
      title: event.title,
      description: event.description,
      kind: event.kind,
      startsAt: localDateTime(event.startsAt),
      endsAt: event.endsAt ? localDateTime(event.endsAt) : '',
      location: event.location || ''
    } : emptyForm);
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : ''
    };
    try {
      if (editing) {
        await eventService.update(editing._id, payload);
        push('Event updated and campus users notified', 'success');
      } else {
        await eventService.create(payload);
        push('Event published and campus users notified', 'success');
      }
      setOpen(false);
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not save event', 'error');
    }
  };

  const remove = async (id) => {
    try {
      await eventService.remove(id);
      push('Event deleted', 'success');
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not delete event', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Event Hub</h1>
          <p className="text-sm text-slate-500">Campus events and college holidays</p>
        </div>
        {canManage && <button className="btn-primary" type="button" onClick={() => openForm()}>Add event or holiday</button>}
      </div>
      {!data?.length ? (
        <div className="card text-slate-500">No events or holidays have been published.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((event) => (
            <article className="card" key={event._id}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {event.kind === 'HOLIDAY' ? 'College holiday' : 'Campus event'}
                  </span>
                  <h2 className="mt-1 font-semibold">{event.title}</h2>
                </div>
                {canManage && <div className="flex gap-2">
                  <button className="btn-secondary" type="button" onClick={() => openForm(event)}>Edit</button>
                  <button className="btn-secondary" type="button" onClick={() => remove(event._id)}>Delete</button>
                </div>}
              </div>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{event.description}</p>
              <p className="mt-3 text-sm font-medium">{formatDateTime(event.startsAt)}</p>
              {event.endsAt && <p className="text-sm text-slate-500">Until {formatDateTime(event.endsAt)}</p>}
              {event.location && <p className="mt-1 text-sm text-slate-500">Location: {event.location}</p>}
            </article>
          ))}
        </div>
      )}

      <Modal open={open} title={editing ? 'Edit event or holiday' : 'Add event or holiday'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <div><label>Title</label><input required maxLength={140} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label>Details</label><textarea required rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label>Type</label><select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="EVENT">Campus event</option><option value="HOLIDAY">College holiday</option></select></div>
            <div><label>Location (optional)</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div><label>Starts</label><input type="datetime-local" required value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></div>
            <div><label>Ends (optional)</label><input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} /></div>
          </div>
          <button className="btn-primary" type="submit">{editing ? 'Save changes' : 'Publish to students and faculty'}</button>
        </form>
      </Modal>
    </div>
  );
}
