import UserManager from './UserManager.jsx';
export default function AdminStudents() {
  return <UserManager role="STUDENT" empty="No students found." />;
}
