import { lazy, Suspense, useState } from 'react';
import { visitorService } from '../../services/visitorService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { formatDateTime } from '../../utils/format.js';

const VisitorCameraScanner = lazy(() => import('./VisitorCameraScanner.jsx'));

export default function VisitorVerification() {
  const [scanning, setScanning] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: visitors, loading, error } = useAsync(async () => (await visitorService.list()).data.data, [refreshKey]);

  const verify = async (token) => {
    setBusy(true);
    setResult(null);
    try {
      const response = await visitorService.verify(token.trim());
      setResult({ success: true, visitor: response.data.data });
      setQrToken('');
      setRefreshKey((value) => value + 1);
    } catch (error) {
      setResult({ success: false, message: error.userMessage || 'Could not verify this pass.' });
    } finally {
      setBusy(false);
    }
  };

  const onScan = (decodedText) => {
      setScanning(false);
      verify(decodedText);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header><h1 className="text-xl font-semibold">Visitor verification</h1><p className="text-sm text-slate-600">Scan an approved pass at arrival and scan it again when the visitor leaves.</p></header>
      <section className="space-y-3">
        <h2 className="font-semibold">Expected visitors</h2>
        {loading ? <LoadingSpinner /> : error ? <p className="text-red-700">{error}</p> : <Table empty="No approved or checked-in visitors." rows={(visitors || []).filter((visitor) => ['APPROVED', 'CHECKED_IN'].includes(visitor.status))} columns={[
          { key: 'visitor', label: 'Visitor', render: (row) => <div><p className="font-medium">{row.visitorName}</p><p className="text-xs text-slate-500">{row.phone} · Host: {row.hostName}</p></div> },
          { key: 'time', label: 'Approved visit', render: (row) => <div>{formatDateTime(row.visitStart)}<br />to {formatDateTime(row.visitEnd)}</div> },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} /> }
        ]} />}
      </section>
      <div className="flex flex-wrap gap-2"><button className="btn-primary" type="button" onClick={() => setScanning((value) => !value)} disabled={busy}>{scanning ? 'Stop camera' : 'Scan QR code'}</button></div>
      {scanning && <Suspense fallback={<p>Loading camera scanner...</p>}><VisitorCameraScanner onScan={onScan} /></Suspense>}
      <form className="space-y-2 border-y border-slate-200 py-4" onSubmit={(event) => { event.preventDefault(); verify(qrToken); }}>
        <label htmlFor="visitor-token">Manual token entry</label>
        <div className="flex gap-2"><input id="visitor-token" className="min-w-0 flex-1" value={qrToken} onChange={(event) => setQrToken(event.target.value)} required /><button className="btn-secondary" disabled={busy}>Verify</button></div>
      </form>
      {result && (
        <div role="status" className={`border p-4 ${result.success ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
          {result.success ? <><p className="font-semibold">{result.visitor.status === 'CHECKED_IN' ? 'Visitor checked in' : 'Visitor checked out'}</p><p>{result.visitor.visitorName} · Host: {result.visitor.hostName}</p></> : <p>{result.message}</p>}
        </div>
      )}
    </div>
  );
}