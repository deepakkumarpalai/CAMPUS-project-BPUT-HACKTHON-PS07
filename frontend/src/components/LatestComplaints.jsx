import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';

export default function LatestComplaints({ complaints = [], to }) {
  const latestComplaints = [...complaints]
    .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))
    .slice(0, 5);

  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Latest complaints</h2>
          <p className="mt-1 text-sm text-slate-500">Recent complaints available to your account.</p>
        </div>
        <Link to={to} className="text-sm font-semibold text-amber-800 hover:text-amber-700">View all</Link>
      </div>
      {!latestComplaints.length ? (
        <p className="text-sm text-slate-500">No complaints have been submitted yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {latestComplaints.map((complaint) => (
            <article key={complaint._id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{complaint.title || complaint.category || 'Campus complaint'}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {complaint.category || 'Other'}
                  {complaint.createdAt && ` · ${new Date(complaint.createdAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge value={complaint.finalPriority || complaint.priority} />
                <StatusBadge value={complaint.status} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
