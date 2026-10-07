const styles = {
  PENDING: 'bg-amber-100 text-amber-800',
  ASSIGNED: 'bg-sky-100 text-sky-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  PROCESSING: 'bg-indigo-100 text-indigo-800',
  READY: 'bg-emerald-100 text-emerald-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
  LOW: 'bg-slate-100 text-slate-700',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
  PRESENT: 'bg-emerald-100 text-emerald-800',
  ABSENT: 'bg-red-100 text-red-800',
  LATE: 'bg-amber-100 text-amber-800',
  AI: 'bg-violet-100 text-violet-800',
  RULE_BASED: 'bg-slate-200 text-slate-700'
};

export default function StatusBadge({ value }) {
  if (!value) return <span className="text-slate-400">—</span>;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[value] || 'bg-slate-100 text-slate-700'}`}>
      {value.replace('_', ' ')}
    </span>
  );
}
