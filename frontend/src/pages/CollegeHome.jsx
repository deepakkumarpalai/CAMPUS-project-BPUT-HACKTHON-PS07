import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FlaskConical,
  GraduationCap,
  Landmark,
  LibraryBig,
  MapPin,
  Megaphone,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicSiteLayout from '../components/PublicSiteLayout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAsync } from '../hooks/useAsync';
import { publicCampusService } from '../services/publicCampusService';
import { formatDate } from '../utils/format.js';

const campusFeatures = [
  { icon: BookOpen, title: 'Academic programs', description: 'Explore course information recorded by campus faculty.', to: '/courses' },
  { icon: FlaskConical, title: 'Departments', description: 'Browse departments represented in the faculty directory.', to: '/departments' },
  { icon: LibraryBig, title: 'Campus facilities', description: 'View facilities information and portal service links.', to: '/facilities' },
  { icon: Users, title: 'Faculty directory', description: 'Find public faculty names and department details.', to: '/faculty' }
];

function DemoTag() {
  return <span className="inline-flex rounded-full border border-amber-300/70 bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-900">Demo data</span>;
}

export default function CollegeHome() {
  const { data, loading, error } = useAsync(async () => {
    const [notices, events, faculty] = await Promise.all([
      publicCampusService.notices(),
      publicCampusService.events(),
      publicCampusService.faculty()
    ]);
    return {
      notices: notices.data.data || [],
      events: events.data.data || [],
      faculty: faculty.data.data || []
    };
  }, []);

  const departments = [...new Set((data?.faculty || []).map((person) => person.department).filter(Boolean))];

  return (
    <PublicSiteLayout>
      <main>
        <section className="relative flex min-h-[620px] items-end overflow-hidden bg-slate-950 sm:min-h-[700px]">
          <img
            className="absolute inset-0 h-full w-full object-cover object-center"
            src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=2200&q=85"
            alt="Illustrative university campus building"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/50 to-slate-900/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/10" />
          <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-36 sm:px-8 sm:pb-24">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
                <span className="h-px w-9 bg-amber-300" /> A college campus platform
              </p>
              <DemoTag />
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.08] tracking-tight text-white sm:text-7xl">
              Discover campus. <span className="font-light italic text-amber-200">Find your next step.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
              CampusConnect brings college information, public notices, events, and campus services together. Connect with your college community and make every opportunity count.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/admissions" className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200">
                Explore admissions <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="rounded-full border border-white/45 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/10">Student login</Link>
              <Link to="/login" className="rounded-full border border-white/45 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/10">Faculty / admin login</Link>
            </div>
            <p className="mt-5 max-w-xl text-xs leading-5 text-white/65">
              Illustrative campus photography and sample college copy are demo content, not official college information.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-9 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">Welcome to CampusConnect</p>
            <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">One place to get to know your campus.</h2>
            <div className="mt-5"><DemoTag /></div>
          </div>
          <div>
            <p className="text-lg leading-8 text-slate-600">
              A college is shaped by its learners, educators, and the ideas they bring to life. CampusConnect is the shared digital front door for campus updates, community activities, and essential student services.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-500">
              This project does not yet contain verified college history, principal details, accreditation, or official contact information. Ask your administrator to add verified institution details before publishing them.
            </p>
            <Link to="/about" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-amber-800">About the college <ArrowRight size={16} /></Link>
          </div>
        </section>

        <section className="bg-[#f1eee6] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">Explore the campus</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A connected college community.</h2>
              </div>
              <DemoTag />
            </div>
            <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {campusFeatures.map(({ icon: Icon, title, description, to }) => (
                <Link key={title} to={to} className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-900"><Icon size={20} /></span>
                  <h3 className="mt-6 font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-amber-900 group-hover:text-amber-700">Explore <ArrowRight size={14} /></span>
                </Link>
              ))}
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-950 p-6 text-white">
                <Users className="text-amber-300" size={22} />
                <p className="mt-4 text-3xl font-semibold">{loading ? '—' : departments.length}</p>
                <p className="mt-1 text-sm text-white/65">Departments in faculty profiles</p>
              </div>
              <div className="rounded-2xl bg-white p-6">
                <Megaphone className="text-amber-800" size={22} />
                <p className="mt-4 text-3xl font-semibold">{loading ? '—' : data.notices.length}</p>
                <p className="mt-1 text-sm text-slate-600">Current public notices</p>
              </div>
              <div className="rounded-2xl bg-white p-6">
                <CalendarDays className="text-amber-800" size={22} />
                <p className="mt-4 text-3xl font-semibold">{loading ? '—' : data.events.length}</p>
                <p className="mt-1 text-sm text-slate-600">Upcoming campus events</p>
              </div>
            </div>
            {error && <p role="status" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Campus announcements could not be loaded: {error}</p>}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800"><Megaphone size={16} /> Public notice board</div>
            <h2 className="mt-3 text-2xl font-semibold">Latest notices</h2>
            {loading ? <LoadingSpinner label="Loading public notices..." /> : error ? (
              <p className="mt-4 text-sm text-red-700">Notices could not be loaded. Please try again later.</p>
            ) : !data.notices.length ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No current public notices have been published.</p>
            ) : <div className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5">
              {data.notices.slice(0, 4).map((notice) => (
                <article key={notice._id} className="py-4">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    <span>{notice.category || 'General'}</span>{notice.department && <span>· {notice.department}</span>}
                  </div>
                  <h3 className="mt-1 font-semibold">{notice.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{notice.description}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDate(notice.createdAt)}</p>
                </article>
              ))}
            </div>}
            <Link to="/notices" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-amber-800">View notice board <ArrowRight size={15} /></Link>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800"><CalendarDays size={16} /> Campus calendar</div>
            <h2 className="mt-3 text-2xl font-semibold">Upcoming events</h2>
            {loading ? <LoadingSpinner label="Loading campus events..." /> : error ? (
              <p className="mt-4 text-sm text-red-700">Events could not be loaded. Please try again later.</p>
            ) : !data.events.length ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No upcoming campus events have been published.</p>
            ) : <div className="mt-5 grid gap-3">
              {data.events.slice(0, 3).map((event) => (
                <article key={event._id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="min-w-[58px] rounded-xl bg-amber-100 px-2 py-3 text-center text-amber-950">
                    <span className="block text-xs font-semibold uppercase">{new Date(event.startsAt).toLocaleString(undefined, { month: 'short' })}</span>
                    <span className="mt-1 block text-2xl font-semibold">{new Date(event.startsAt).getDate()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800">{event.kind === 'HOLIDAY' ? 'College holiday' : 'Campus event'}</p>
                    <h3 className="mt-1 font-semibold">{event.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{event.description}</p>
                    {event.location && <p className="mt-2 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} />{event.location}</p>}
                  </div>
                </article>
              ))}
            </div>}
            <Link to="/events" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-amber-800">View events <ArrowRight size={15} /></Link>
          </div>
        </section>

        <section className="bg-slate-950 px-5 py-16 text-white sm:px-8 sm:py-20">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-300"><GraduationCap size={19} /> Student, faculty, and campus services</div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Your campus community, connected.</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">Sign in to access role-specific tools. Private student and faculty records are not part of this public site.</p>
            </div>
            <Link to="/login" className="inline-flex shrink-0 items-center justify-center gap-3 self-start rounded-full bg-amber-300 px-7 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 sm:self-auto">
              Sign in to CampusConnect <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
    </PublicSiteLayout>
  );
}
