export default function DashboardCard({ title, value, icon, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700'
  };
  return (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-semibold">{value ?? 0}</p>
      </div>
      <div className={`rounded-full p-3 ${tones[tone]}`}>{icon}</div>
    </div>
  );
}
