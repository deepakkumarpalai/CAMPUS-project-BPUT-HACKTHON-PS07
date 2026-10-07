import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAsync } from '../../hooks/useAsync';
import { interactionService } from '../../services/interactionService';
import { useToast } from '../../context/ToastContext.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Modal from '../../components/Modal.jsx';

const phoneLink = (phone) => phone.replace(/[^\d+]/g, '');
const whatsappLink = (phone) => phone.replace(/\D/g, '');

export default function InteractionsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data, loading, error, reload } = useAsync(async () => (await interactionService.list()).data.data, []);
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: searchParams.get('title') || '',
    description: '',
    category: searchParams.get('category') || 'GENERAL',
    contactPhone: user?.phone || ''
  });

  const create = async (e) => {
    e.preventDefault();
    try {
      await interactionService.create(form);
      push('Problem posted for campus users', 'success');
      setOpen(false);
      setForm({ title: '', description: '', category: 'GENERAL', contactPhone: user?.phone || '' });
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not post problem', 'error');
    }
  };

  const updateStatus = async (item) => {
    try {
      await interactionService.update(item._id, { status: item.status === 'OPEN' ? 'RESOLVED' : 'OPEN' });
      push('Problem status updated', 'success');
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not update status', 'error');
    }
  };

  const remove = async (id) => {
    try {
      await interactionService.remove(id);
      push('Problem deleted', 'success');
      reload();
    } catch (err) {
      push(err.userMessage || 'Could not delete problem', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold">Campus Interaction</h1><p className="text-sm text-slate-500">Share a problem and contact the person who posted it by phone or WhatsApp.</p></div>
        {user?.role !== 'ADMIN' && <button className="btn-primary" type="button" onClick={() => setOpen(true)}>Post a problem</button>}
      </div>
      {!data?.length ? <div className="card text-slate-500">No campus problems have been posted.</div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((item) => {
            const isOwner = item.createdBy?._id === user?._id;
            return (
              <article className="card" key={item._id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase text-blue-700">{item.category} · {item.status}</p>
                    <h2 className="mt-1 font-semibold">{item.title}</h2>
                  </div>
                  {(isOwner || user?.role === 'ADMIN') && <button className="btn-secondary" type="button" onClick={() => updateStatus(item)}>{item.status === 'OPEN' ? 'Mark resolved' : 'Reopen'}</button>}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.description}</p>
                <p className="mt-3 text-xs text-slate-500">Posted by {item.createdBy?.name || 'Campus user'} · {item.createdBy?.role}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a className="btn-primary" href={`tel:${phoneLink(item.contactPhone)}`}>Call {item.contactPhone}</a>
                  <a className="btn-secondary" href={`https://wa.me/${whatsappLink(item.contactPhone)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                  {(isOwner || user?.role === 'ADMIN') && <button className="btn-secondary" type="button" onClick={() => remove(item._id)}>Delete</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
      <Modal open={open} title="Post a campus problem" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="space-y-3">
          <div><label>Title</label><input required maxLength={140} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label>Details</label><textarea required rows={4} maxLength={4000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label>Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="GENERAL">General problem</option><option value="ACADEMIC">Academic</option><option value="RESULT">Result issue</option><option value="FACILITY">Campus facility</option><option value="OTHER">Other</option></select></div>
          <div><label>Phone / WhatsApp number (visible to signed-in campus users)</label><input required type="tel" placeholder="Include country code for WhatsApp, e.g. +91…" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
          <button className="btn-primary" type="submit">Share with campus users</button>
        </form>
      </Modal>
    </div>
  );
}
