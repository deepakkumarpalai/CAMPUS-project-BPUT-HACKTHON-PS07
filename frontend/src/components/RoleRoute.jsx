import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import { dashboardPath } from '../utils/format.js';

export default function RoleRoute({ roles, children }) {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={dashboardPath(user.role)} replace />;
  return children;
}
