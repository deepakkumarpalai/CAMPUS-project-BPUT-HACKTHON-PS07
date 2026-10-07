import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-slate-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-blue-300">University Portal</p>
          <h1 className="mt-4 text-4xl font-semibold">Smart Campus</h1>
          <p className="mt-4 max-w-md text-slate-300">
            One platform for notices, attendance, leave, complaints, certificates, gate pass and campus services.
          </p>
        </div>
        <p className="text-sm text-slate-400">Requires an internet connection. MongoDB Atlas is the system of record.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="card w-full max-w-md space-y-4">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
            <button className={`rounded-md px-3 py-2 text-sm font-medium ${loginMode === 'student' ? 'bg-white shadow-sm' : 'text-slate-600'}`} type="button" onClick={() => setLoginMode('student')}>Student</button>
            <button className={`rounded-md px-3 py-2 text-sm font-medium ${loginMode === 'email' ? 'bg-white shadow-sm' : 'text-slate-600'}`} type="button" onClick={() => setLoginMode('email')}>Faculty / Admin</button>
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
              <p className="text-xs text-slate-500">Student sign-in requires your administrator to set your date of birth on your student account.</p>
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
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
          {loginMode === 'email' && <p className="text-sm text-slate-500">
            New user? <Link className="text-blue-700" to="/register">Register</Link>
          </p>}
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Demo account passwords must be configured in backend/.env before running the seed script.
          </div>
        </form>
      </div>
    </div>
  );
}
