import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { dashboardPath } from '../../utils/format.js';

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [studentForm, setStudentForm] = useState({ registrationNo: '', dateOfBirth: '' });
  const [loginMode, setLoginMode] = useState('student');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={dashboardPath(user.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const logged = await login(loginMode === 'student' ? studentForm : form);
      push('Logged in successfully', 'success');
      navigate(dashboardPath(logged.role));
    } catch (error) {
      push(error.userMessage || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#fbfaf7] lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-slate-900 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1600&q=85"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-slate-950/25" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-16">
          <Link to="/" className="flex w-fit items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/10"><Landmark size={21} /></span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">SMART CAMPUS</span>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-white/65">College portal</span>
            </span>
          </Link>
          <div className="max-w-xl pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">Welcome back</p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight xl:text-6xl">Your campus, all in one place.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/75">
              Stay close to campus life with notices, attendance, requests, and services in one convenient portal.
            </p>
          </div>
          <p className="text-xs text-white/55">A simpler way to stay connected to college.</p>
        </div>
      </section>
      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Smart Campus portal</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Sign in to continue</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Choose your account type and enter your details.</p>
          </div>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#eeece6] p-1.5">
              <button className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${loginMode === 'student' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`} type="button" onClick={() => setLoginMode('student')}>Student</button>
              <button className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${loginMode === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`} type="button" onClick={() => setLoginMode('email')}>Staff / Admin</button>
            </div>
            {loginMode === 'student' ? (
              <>
                <div>
                  <label>Registration number</label>
                  <input autoComplete="username" required value={studentForm.registrationNo} onChange={(e) => setStudentForm({ ...studentForm, registrationNo: e.target.value })} />
                </div>
                <div>
                  <label>Date of birth</label>
                  <input type="date" autoComplete="bday" required value={studentForm.dateOfBirth} onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })} />
                </div>
                <p className="-mt-2 text-xs leading-5 text-slate-500">Student sign-in requires your administrator to set your date of birth on your student account.</p>
              </>
            ) : (
              <>
                <div>
                  <label>Email</label>
                  <input type="email" autoComplete="username" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label>Password</label>
                  <input type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              </>
            )}
            <button className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            {loginMode === 'email' && <p className="text-sm text-slate-500">
              New user? <Link className="font-medium text-amber-800 hover:text-amber-900" to="/register">Register</Link>
            </p>}
            <p className="text-sm text-slate-500">Visiting campus? <Link className="font-medium text-amber-800 hover:text-amber-900" to="/visitor/request">Request a visitor pass</Link></p>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs leading-5 text-slate-500">
              Demo account passwords must be configured in backend/.env before running the seed script.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
