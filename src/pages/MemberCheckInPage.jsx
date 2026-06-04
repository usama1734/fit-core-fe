import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

/** Legacy poster URLs; in-app check-in is on Attendance. */
export default function MemberCheckInPage() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login?redirect=%2Fattendance" replace />;
  }

  return <Navigate to="/attendance" replace />;
}
