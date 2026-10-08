import { useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { userService } from '../../services/userService';

export default function SecurityUsers() {
  const { push } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading, error } = useAsync(async () => (await userService.list({ role: 'SECURITY' })).data.data, [refreshKey]);

  const create = async (event) => {
    event.preventDefault();
    try {
      await userService.createSecurity(form);
      setForm({ name: '', email: '', password: '' });
      setRefreshKey((value) => value + 1);
      push('Security account created', 'success');
    } catch (requestError) {
      push(requestError.userMessage || 'Could not create account.', 'error');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this Security account?')) return;
    try {
      await userService.remove(id);
      setRefreshKey((value) => value + 1);
      push('Security account deleted', 'success');
    } catch (requestError) {
      push(requestError.userMessage || 'Could not delete account.', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <header><h1 className="text-xl font-semibold">Security accounts</h1><p className="text-sm text-slate-600">Only administrators can create accounts authorized to verify visitor passes.</p></header>
      <form onSubmit={create} className="grid gap-3 border-y border-slate-200 py-5 sm:grid-cols-4 sm:items-end">
        <div><label htmlFor="security-name">Name</label><input id="security-name" required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
        <div><label htmlFor="security-email">Email</label><input id="security-email" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
        <div><label htmlFor="security-password">Temporary password</label><input id="security-password" type="password" minLength={8} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div>
        <button className="btn-primary">Create account</button>
      </form>
      <Table empty="No Security accounts have been created." rows={data || []} columns={[
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'role', label: 'Role' },
        { key: 'actions', label: 'Action', render: (row) => <button className="btn-secondary" type="button" onClick={() => remove(row._id)}>Delete</button> }
      ]} />
    </div>
  );
}