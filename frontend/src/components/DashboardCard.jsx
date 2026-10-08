export default function DashboardCard({ title, value, icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700'
  };
  return (
    <div className="card flex min-h-[132px] items-center justify-between transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value ?? 0}</p>
      </div>
      <div className={`rounded-2xl p-3.5 ${tones[tone]}`}>{icon}</div>
    </div>
  );
}
