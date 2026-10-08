import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { visitorService } from '../../services/visitorService';
import { formatDateTime } from '../../utils/format.js';

const REFERENCE_STORAGE_KEY = 'campus_visitor_reference';

export default function VisitorRequest() {
  const [form, setForm] = useState({
    visitorName: '', email: '', phone: '', organization: '', purpose: '', hostName: '', visitStart: '', visitEnd: ''
  });
  const [referenceCode, setReferenceCode] = useState(() => localStorage.getItem(REFERENCE_STORAGE_KEY) || '');
  const [visitor, setVisitor] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await visitorService.create(form);
      const reference = response.data.data.referenceCode;
      localStorage.setItem(REFERENCE_STORAGE_KEY, reference);
      setReferenceCode(reference);
      setVisitor({ status: 'PENDING' });
      setForm({ visitorName: '', email: '', phone: '', organization: '', purpose: '', hostName: '', visitStart: '', visitEnd: '' });
    } catch (error) {
      setMessage(error.userMessage || 'Could not submit the visit request.');
    } finally {
      setBusy(false);
    }
  };

  const checkStatus = async () => {
    if (!referenceCode) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await visitorService.status(referenceCode);
      setVisitor(response.data.data);
    } catch (error) {
      setMessage(error.userMessage || 'Could not load this visitor request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-5 sm:p-8">
      <header>
        <p className="text-sm font-semibold uppercase text-blue-700">CampusConnect Visitor Desk</p>
        <h1 className="mt-2 text-3xl font-semibold">Request a campus visit</h1>
        <p className="mt-2 text-slate-600">Submit your details for approval. An approved pass includes a QR code for the security desk.</p>
      </header>

      {message && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-red-800">{message}</p>}

      <form onSubmit={submit} className="space-y-4 border-y border-slate-200 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="visitor-name">Full name</label><input id="visitor-name" required maxLength={100} value={form.visitorName} onChange={(event) => setForm({ ...form, visitorName: event.target.value })} /></div>
          <div><label htmlFor="visitor-email">Email</label><input id="visitor-email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
          <div><label htmlFor="visitor-phone">Phone</label><input id="visitor-phone" type="tel" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></div>
          <div><label htmlFor="visitor-organization">Organization</label><input id="visitor-organization" maxLength={120} value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} /></div>
          <div><label htmlFor="visitor-host">Campus host</label><input id="visitor-host" required maxLength={100} value={form.hostName} onChange={(event) => setForm({ ...form, hostName: event.target.value })} /></div>
          <div><label htmlFor="visitor-start">Visit starts</label><input id="visitor-start" type="datetime-local" required value={form.visitStart} onChange={(event) => setForm({ ...form, visitStart: event.target.value })} /></div>
          <div><label htmlFor="visitor-end">Visit ends</label><input id="visitor-end" type="datetime-local" required value={form.visitEnd} onChange={(event) => setForm({ ...form, visitEnd: event.target.value })} /></div>
        </div>
        <div><label htmlFor="visitor-purpose">Purpose of visit</label><textarea id="visitor-purpose" required maxLength={500} rows={3} value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} /></div>
        <button className="btn-primary" disabled={busy}>{busy ? 'Please wait...' : 'Submit visit request'}</button>
      </form>

      {referenceCode && (
        <section className="space-y-3" aria-live="polite">
          <h2 className="text-xl font-semibold">Check request status</h2>
          <p className="break-all text-sm text-slate-600">Your private reference: {referenceCode}</p>
          <button className="btn-secondary" type="button" onClick={checkStatus} disabled={busy}>Refresh status</button>
          {visitor && <p className="font-medium">Status: {visitor.status?.replace('_', ' ')}</p>}
          {visitor?.visitStart && <p className="text-sm text-slate-600">Visit: {formatDateTime(visitor.visitStart)} to {formatDateTime(visitor.visitEnd)}</p>}
          {visitor?.qrToken && <div className="inline-grid justify-items-center gap-3 border border-slate-200 p-4"><QRCodeSVG value={visitor.qrToken} size={208} level="Q" /><p className="text-sm font-medium">Show this QR code to campus security</p></div>}
          {visitor?.status === 'PENDING' && <p className="text-sm text-slate-600">Your request is waiting for administrator approval.</p>}
          {visitor?.status === 'REJECTED' && <p className="text-sm text-red-700">This visit request was not approved.</p>}
        </section>
      )}
    </main>
  );
}