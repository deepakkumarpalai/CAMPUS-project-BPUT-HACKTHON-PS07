import { NavLink } from 'react-router-dom';

export default function Sidebar({ items, open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed z-40 h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-900 text-white transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-slate-700 px-5 py-6">
          <p className="text-lg font-semibold">Campus Portal</p>
          <p className="text-xs text-slate-400">Services in one place</p>
        </div>
        <nav className="space-y-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
