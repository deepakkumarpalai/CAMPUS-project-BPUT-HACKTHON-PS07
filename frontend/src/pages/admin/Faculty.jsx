import UserManager from './UserManager.jsx';
import FacultyAssignments from './FacultyAssignments.jsx';
export default function AdminFaculty() {
  return (
    <div className="space-y-8">
      <UserManager role="FACULTY" empty="No faculty accounts found." />
      <FacultyAssignments />
    </div>
  );
}
