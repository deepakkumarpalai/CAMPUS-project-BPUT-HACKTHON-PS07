import { useState } from 'react';
import { ArrowRight, Landmark, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const links = [
  ['About College', '/about'],
  ['Departments', '/departments'],
  ['Courses', '/courses'],
  ['Faculty', '/faculty'],
  ['Notice Board', '/notices'],
  ['Events', '/events'],
  ['Clubs & Activities', '/clubs'],
  ['Facilities', '/facilities'],
  ['Contact', '/contact']
];

export default function PublicSiteLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#fbfaf7]/95 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/home" className="flex shrink-0 items-center gap-3" aria-label="CampusConnect home">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-amber-300">
              <Landmark size={19} />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">CampusConnect</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">College campus portal</span>
            </span>
          </Link>
          <div className="hidden items-center gap-5 xl:flex">
            {links.map(([label, path]) => (
              <Link key={path} to={path} className="text-xs font-medium text-slate-600 transition hover:text-amber-800">{label}</Link>
            ))}
          </div>
          <div className="hidden items-center gap-3 sm:flex">
            <Link to="/admissions" className="text-sm font-medium text-slate-600 hover:text-slate-950">Admissions</Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
              Login <ArrowRight size={15} />
            </Link>
          </div>
          <button
            type="button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            className="rounded-xl border border-slate-200 bg-white p-2 sm:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </nav>
        {menuOpen && <div className="border-t border-slate-200 bg-white px-5 py-4 sm:hidden">
          <div className="grid grid-cols-2 gap-2">
            {links.map(([label, path]) => (
              <Link key={path} to={path} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-[#f4f2ec]">{label}</Link>
            ))}
            <Link to="/admissions" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-[#f4f2ec]">Admissions</Link>
            <Link to="/placement" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-[#f4f2ec]">Placements</Link>
            <Link to="/login" onClick={() => setMenuOpen(false)} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white">Login</Link>
          </div>
        </div>}
      </header>
      {children}
      <footer className="bg-slate-950 px-5 py-8 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold">CampusConnect</p>
            <p className="mt-1 text-xs text-white/55">College campus information and services portal.</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/65">
            {links.map(([label, path]) => <Link key={path} to={path} className="hover:text-white">{label}</Link>)}
            <Link to="/login" className="hover:text-white">Login</Link>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-7xl border-t border-white/10 pt-4 text-[11px] text-white/40">
          Public information only. Personal student and faculty records remain protected.
        </div>
      </footer>
    </div>
  );
}
