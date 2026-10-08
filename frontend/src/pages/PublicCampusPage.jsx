import { useMemo, useState } from 'react';
import { ArrowRight, CalendarDays, Mail, MapPin, Search, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import PublicSiteLayout from '../components/PublicSiteLayout.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useAsync } from '../hooks/useAsync';
import { publicCampusService } from '../services/publicCampusService';
import { formatDate, formatDateTime } from '../utils/format.js';

const DEMO_DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering'
];

const DEMO_FACILITIES = [
  ['Library', 'Illustrative campus facility information. Confirm opening hours and services with the college.'],
  ['Computer laboratories', 'Illustrative facility listing. Lab availability and equipment are not maintained in the portal yet.'],
  ['Academic laboratories', 'Laboratory and department-specific information should be confirmed by the college.'],
  ['Hostel and dining', 'Hostel and mess services are represented in student workflows; room and menu details are not configured here.'],
  ['Sports and recreation', 'Illustrative campus facility. Official amenities and access information have not been provided.'],
  ['Medical and student help', 'Contact the college directly for verified emergency and health service information.'],
  ['Campus Wi-Fi and transport', 'Connectivity and transport requests can use portal services; official coverage and route details are not configured.'],
  ['Security and parking', 'Use official campus channels for verified security, visitor, and parking information.']
];

const DEMO_CLUBS = [
  'Coding Club',
  'Robotics Club',
  'Literary Club',
  'Cultural Club',
  'Sports Club',
  'Entrepreneurship Club',
  'NSS',
  'NCC'
];

const PAGE_CONTENT = {
  about: {
    eyebrow: 'College information',
    title: 'About the college',
    intro: 'The institution profile is not yet configured with verified college information.',
    demo: false
  },
  departments: {
    eyebrow: 'Academic community',
    title: 'Departments',
    intro: 'Department names and faculty counts are drawn from faculty profile records when available.',
    demo: true
  },
  courses: {
    eyebrow: 'Programs and learning',
    title: 'Courses',
    intro: 'Course names shown here come from course lists entered in faculty profiles. Duration, eligibility, and semester details are not maintained in the current project.',
    demo: false
  },
  faculty: {
    eyebrow: 'People who teach and inspire',
    title: 'Faculty directory',
    intro: 'This public directory shows only faculty name, department, and course labels available in campus records. Private contact and account information is excluded.',
    demo: false
  },
  notices: {
    eyebrow: 'Campus updates',
    title: 'Public notice board',
    intro: 'Only active notices published to the ALL audience are shown publicly.',
    demo: false
  },
  events: {
    eyebrow: 'Campus calendar',
    title: 'Events and activities',
    intro: 'Upcoming campus events and holidays currently published in the portal.',
    demo: false
  },
  facilities: {
    eyebrow: 'Campus life',
    title: 'Campus facilities',
    intro: 'The list below is illustrative demo information. Verified facility details have not yet been entered into the project.',
    demo: true
  },
  clubs: {
    eyebrow: 'Student community',
    title: 'Clubs and activities',
    intro: 'The list below is illustrative demo content. Official clubs, coordinators, and activities have not yet been entered.',
    demo: true
  },
  contact: {
    eyebrow: 'Get in touch',
    title: 'Contact the college',
    intro: 'Official address, telephone, email, website, and office contacts have not yet been configured. No contact details on this page are invented.',
    demo: false
  },
  admissions: {
    eyebrow: 'Start your journey',
    title: 'Admissions information',
    intro: 'Official admission programs, dates, eligibility, and application instructions have not yet been provided.',
    demo: false
  },
  placement: {
    eyebrow: 'Career opportunities',
    title: 'Placements',
    intro: 'Placement announcements and job listings are not currently configured for public display.',
    demo: false
  }
};

function DemoBadge() {
  return <span className="inline-flex rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-900">Demo data · verify before use</span>;
}

function EmptyState({ children }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-sm leading-6 text-slate-600">{children}</div>;
}

export default function PublicCampusPage({ page: pageProp }) {
  const params = useParams();
  const page = pageProp || params.page || 'about';
  const info = PAGE_CONTENT[page] || PAGE_CONTENT.about;
  const [search, setSearch] = useState('');
  const { data, loading, error } = useAsync(async () => {
    if (['notices', 'events'].includes(page)) {
      const response = page === 'notices'
        ? await publicCampusService.notices()
        : await publicCampusService.events();
      return { items: response.data.data || [] };
    }
    if (['faculty', 'departments', 'courses'].includes(page)) {
      const response = await publicCampusService.faculty();
      return { faculty: response.data.data || [] };
    }
    return {};
  }, [page]);

  const faculty = data?.faculty || [];
  const departments = useMemo(() => {
    const departmentMap = new Map();
    faculty.forEach((person) => {
      if (!person.department) return;
      departmentMap.set(person.department, (departmentMap.get(person.department) || 0) + 1);
    });
    return [...departmentMap.entries()].map(([name, facultyCount]) => ({ name, facultyCount }));
  }, [faculty]);
  const courses = useMemo(
    () => [...new Set(faculty.flatMap((person) => person.courses || []).filter(Boolean))].sort(),
    [faculty]
  );
  const query = search.trim().toLowerCase();

  let content;
  if (['notices', 'events'].includes(page)) {
    const items = (data?.items || []).filter((item) =>
      `${item.title} ${item.description} ${item.category || item.location || ''}`.toLowerCase().includes(query)
    );
    content = loading ? <LoadingSpinner label={`Loading public ${page}...`} /> : error ? (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Could not load public {page}: {error}</p>
    ) : !items.length ? <EmptyState>No public {page} are available right now.</EmptyState> : (
      <div className="grid gap-4">
        {items.map((item) => (
          <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                  {page === 'notices' ? `${item.category || 'General'}${item.department ? ` · ${item.department}` : ''}` : item.kind === 'HOLIDAY' ? 'College holiday' : 'Campus event'}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
              </div>
              {page === 'events' && <CalendarDays size={19} className="text-amber-800" />}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              <span>{formatDateTime(page === 'notices' ? item.createdAt : item.startsAt)}</span>
              {page === 'events' && item.location && <span className="inline-flex items-center gap-1"><MapPin size={13} />{item.location}</span>}
            </div>
          </article>
        ))}
      </div>
    );
  } else if (page === 'faculty') {
    const people = faculty.filter((person) =>
      `${person.name} ${person.department} ${(person.courses || []).join(' ')}`.toLowerCase().includes(query)
    );
    content = loading ? <LoadingSpinner label="Loading public faculty directory..." /> : error ? (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Could not load faculty directory: {error}</p>
    ) : !people.length ? <EmptyState>No public faculty profiles are available{query ? ' for this search.' : ' yet.'}</EmptyState> : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person, index) => (
          <article key={`${person.name}-${person.department}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-900"><Users size={20} /></div>
            <h2 className="mt-4 font-semibold">{person.name}</h2>
            <p className="mt-1 text-sm text-slate-600">{person.department || 'Department not listed'}</p>
            {!!person.courses?.length && <p className="mt-3 text-xs leading-5 text-slate-500">Courses: {person.courses.join(', ')}</p>}
          </article>
        ))}
      </div>
    );
  } else if (page === 'departments') {
    content = loading ? <LoadingSpinner label="Loading departments..." /> : error ? (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Could not load department information: {error}</p>
    ) : departments.length ? (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map(({ name, facultyCount }) => (
          <article key={name} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold">{name}</h2>
            <p className="mt-2 text-sm text-slate-600">{facultyCount} public faculty profile{facultyCount === 1 ? '' : 's'}</p>
            <p className="mt-3 text-xs text-slate-500">HOD, laboratories, and department contact details are not configured.</p>
          </article>
        ))}
      </div>
    ) : <EmptyState>No faculty department information has been added yet. The illustrative department list below is demo content only.</EmptyState>;
    if (!loading && !error && departments.length === 0) {
      content = <div className="space-y-4"><EmptyState>No faculty department information has been added yet.</EmptyState><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{DEMO_DEPARTMENTS.map((name) => <article key={name} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"><p className="font-medium">{name}</p><p className="mt-1 text-xs text-slate-500">Illustrative demo entry · not verified</p></article>)}</div></div>;
    }
  } else if (page === 'courses') {
    const matchingCourses = courses.filter((course) => course.toLowerCase().includes(query));
    content = loading ? <LoadingSpinner label="Loading course names..." /> : error ? (
      <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Could not load course information: {error}</p>
    ) : courses.length ? (
      <div className="space-y-4">
        {!matchingCourses.length ? <EmptyState>{query ? 'No courses match your search.' : 'No course names have been entered in faculty profiles yet.'}</EmptyState> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{matchingCourses.map((course) => <article key={course} className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">{course}</h2><p className="mt-2 text-xs leading-5 text-slate-500">Duration, eligibility, and semester structure are not maintained in current records.</p></article>)}</div>}
      </div>
    ) : <EmptyState>No course names are available in the current campus records. Add the college’s verified programs before publishing a prospectus.</EmptyState>;
  } else if (page === 'facilities') {
    content = <div className="space-y-4"><DemoBadge /><div className="grid gap-4 sm:grid-cols-2">{DEMO_FACILITIES.map(([title, description]) => <article key={title} className="rounded-2xl border border-amber-200 bg-white p-6"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}</div></div>;
  } else if (page === 'clubs') {
    content = <div className="space-y-4"><DemoBadge /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{DEMO_CLUBS.map((name) => <article key={name} className="rounded-2xl border border-amber-200 bg-white p-6"><h2 className="font-semibold">{name}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Illustrative student club. Faculty coordinator, student coordinator, and activity schedule are not configured.</p></article>)}</div></div>;
  } else if (page === 'about') {
    content = <div className="grid gap-4 md:grid-cols-2">
      {[
        ['College history', 'Verified institutional history and established year have not been entered.'],
        ['Vision and mission', 'Official vision, mission, objectives, affiliations, and accreditation details have not been provided.'],
        ['Principal’s message', 'A verified principal message is not available in current project data.'],
        ['Achievements and infrastructure', 'Official achievements and infrastructure information have not been entered.']
      ].map(([title, description]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></article>)}
    </div>;
  } else if (page === 'contact') {
    content = <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-900"><Mail size={20} /></div>
      <h2 className="mt-4 text-lg font-semibold">Official contact details are not configured</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">College address, phone, email, website, and admission/examination/placement office contacts are not stored in this project. Contact your college administrator for verified details.</p>
      <Link to="/visitor/request" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-900 hover:text-amber-700">Request a visitor pass <ArrowRight size={15} /></Link>
    </div>;
  } else if (page === 'admissions') {
    content = <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 className="text-lg font-semibold">Admission information is not configured</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">Official program offerings, eligibility, deadlines, fees, and application instructions must be supplied and verified by the college. Do not treat portal registration as a college admission application.</p>
      <Link to="/register" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Register for portal access <ArrowRight size={15} /></Link>
    </div>;
  } else {
    content = <EmptyState>Placement announcements, companies, job openings, eligibility rules, and deadlines are not currently configured. <Link to="/login" className="font-semibold text-amber-900">Sign in</Link> to use available campus services.</EmptyState>;
  }

  return (
    <PublicSiteLayout>
      <main className="mx-auto min-h-[65vh] max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">{info.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">{info.title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{info.intro}</p>
          {info.demo && <div className="mt-4"><DemoBadge /></div>}
        </div>
        {['notices', 'events', 'faculty'].includes(page) && (
          <label className="mb-6 flex max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-white px-4">
            <Search size={17} className="shrink-0 text-slate-400" />
            <span className="sr-only">Search {page}</span>
            <input className="!border-0 !px-0 !shadow-none !ring-0" placeholder={`Search ${page}...`} value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        )}
        {content}
        <div className="mt-10 border-t border-slate-200 pt-6 text-xs leading-5 text-slate-500">
          Public information is separate from private student and faculty records. <Link to="/login" className="font-semibold text-amber-900 hover:text-amber-700">Login to CampusConnect <ArrowRight size={12} className="inline" /></Link>
          {page === 'events' && <span className="ml-2">Dates shown in your local time ({formatDate(new Date())}).</span>}
        </div>
      </main>
    </PublicSiteLayout>
  );
}
