import { facultyAssignmentService } from '../../services/facultyAssignmentService';
import { useAsync } from '../../hooks/useAsync';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function FacultyAssignments() {
  const { data, loading, error } = useAsync(async () => (await facultyAssignmentService.list()).data.data, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">Faculty teaching assignments</h2>
        <p className="text-sm text-slate-500">Imported teacher directory and course assignments. These records do not create portal login accounts.</p>
      </div>
      {!data?.length ? (
        <div className="card text-slate-500">No faculty teaching assignments imported.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
              <th className="px-4 py-3">Teacher ID</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Semester</th>
              <th className="px-4 py-3">Branch / Class / Section</th>
            </tr></thead>
            <tbody>{data.map((item) => (
              <tr className="border-t border-slate-100" key={item._id}>
                <td className="px-4 py-3">{item.teacherId}</td>
                <td className="px-4 py-3">{item.teacherName}</td>
                <td className="px-4 py-3">{item.department}</td>
                <td className="px-4 py-3">{item.phoneNumber}</td>
                <td className="px-4 py-3">{item.subject}</td>
                <td className="px-4 py-3">{item.semester}</td>
                <td className="px-4 py-3">{item.branch} / {item.className} / {item.section}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
