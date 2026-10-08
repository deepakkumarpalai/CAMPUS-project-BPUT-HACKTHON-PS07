import { Link, NavLink } from 'react-router-dom';
import { Landmark } from 'lucide-react';

export default function Sidebar({ items, open, onClose }) {
  return (
    <>
      {open && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed z-40 flex h-screen w-[280px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-slate-950 text-white transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <Link to="/" className="flex items-center gap-3 rounded-lg">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/10 text-amber-300">
              <Landmark size={19} />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">SMART CAMPUS</span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-[0.2em] text-slate-400">College portal</span>
            </span>
          </Link>
        </div>
        <p className="px-5 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
        <nav className="flex-1 space-y-1 px-3 pb-5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive ? 'bg-amber-300 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/[0.07] hover:text-white'
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-xs text-slate-400">Your campus, connected.</p>
        </div>
      </aside>
    </>
  );
}
