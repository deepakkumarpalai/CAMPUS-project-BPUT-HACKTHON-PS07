import { useAuth } from '../../context/AuthContext.jsx';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext.jsx';
import { useState } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    studentId: user?.studentId || '',
    facultyId: user?.facultyId || ''
  });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.update(user._id, form);
      push('Profile updated', 'success');
    } catch (error) {
      push(error.userMessage || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="card max-w-2xl space-y-4">
      <h2 className="text-xl font-semibold">Profile</h2>
      <p className="text-sm text-slate-500">{user?.email} · {user?.role}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label>Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label>Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label>Department</label>
          <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
        </div>
        {user?.role === 'STUDENT' && (
          <div>
            <label>Student ID</label>
            <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
          </div>
        )}
        {user?.role === 'FACULTY' && (
          <div>
            <label>Faculty ID</label>
            <input value={form.facultyId} onChange={(e) => setForm({ ...form, facultyId: e.target.value })} />
          </div>
        )}
      </div>
      <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
    </form>
  );
}
