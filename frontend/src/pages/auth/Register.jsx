import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { dashboardPath } from '../../utils/format.js';

export default function Register() {
  const { register, isAuthenticated, user } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    phone: '',
    department: '',
    studentId: '',
    facultyId: ''
  });
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={dashboardPath(user.role)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await register(form);
      push('Account created', 'success');
      navigate(dashboardPath(created.role));
    } catch (error) {
      push(error.userMessage || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-xl items-center p-6">
      <form onSubmit={submit} className="card w-full space-y-4">
        <h2 className="text-2xl font-semibold">Create account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label>Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label>Password</label>
            <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div>
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label>Department</label>
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          {form.role === 'STUDENT' && (
            <div>
              <label>Student ID</label>
              <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
            </div>
          )}
          {form.role === 'FACULTY' && (
            <div>
              <label>Faculty ID</label>
              <input value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} />
            </div>
          )}
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Register'}
        </button>
        <p className="text-sm text-slate-500">
          Already registered? <Link className="text-blue-700" to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
