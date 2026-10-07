import { useState } from 'react';
import { userService } from '../../services/userService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import Table from '../../components/Table.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Modal from '../../components/Modal.jsx';

export default function UserManager({ role, empty }) {
  const { push } = useToast();
  const [search, setSearch] = useState('');
  const [dobStudent, setDobStudent] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const { data, loading, error, reload } = useAsync(async () => (await userService.list({ role, search })).data.data, [role, search]);

  const remove = async (id) => {
    try {
      await userService.remove(id);
      push('User deleted', 'success');
      reload();
    } catch (err) {
      push(err.userMessage || 'Delete failed', 'error');
    }
  };

  const saveDateOfBirth = async (e) => {
    e.preventDefault();
    try {
      await userService.setStudentDob(dobStudent._id, dateOfBirth);
      push('Student DOB sign-in enabled', 'success');
      setDobStudent(null);
      setDateOfBirth('');
    } catch (err) {
      push(err.userMessage || 'Could not set student date of birth', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{role === 'STUDENT' ? 'Student management' : 'Faculty management'}</h2>
      <input placeholder="Search by name, email or ID" value={search} onChange={(e) => setSearch(e.target.value)} />
      <Table
        empty={empty}
        rows={data || []}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'department', label: 'Department' },
          { key: 'id', label: 'ID', render: (row) => row.studentId || row.facultyId || '—' },
          { key: 'demo', label: 'Demo', render: (row) => (row.isDemo ? 'DEMO' : '—') },
          { key: 'act', label: 'Action', render: (row) => (
            <div className="flex flex-wrap gap-2">
              {role === 'STUDENT' && <button className="btn-secondary" type="button" onClick={() => { setDobStudent(row); setDateOfBirth(''); }}>Set DOB login</button>}
              <button className="btn-secondary" type="button" onClick={() => remove(row._id)}>Delete</button>
            </div>
          ) }
        ]}
      />
      <Modal open={Boolean(dobStudent)} title={`Set student DOB login${dobStudent ? ` · ${dobStudent.name}` : ''}`} onClose={() => setDobStudent(null)}>
        <form onSubmit={saveDateOfBirth} className="space-y-3">
          <p className="text-sm text-slate-600">The date of birth is saved as a secure password hash and is never shown in the student list.</p>
          <div><label>Date of birth</label><input required type="date" max={new Date().toISOString().slice(0, 10)} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} /></div>
          <button className="btn-primary" type="submit">Enable DOB login</button>
        </form>
      </Modal>
    </div>
  );
}
