import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const userStr = localStorage.getItem('user');

  if (!userStr) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (!user || !user.id) {
      localStorage.removeItem('user');
      return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to correct dashboard based on actual role
      if (user.role === 'ADMIN') {
        return <Navigate to="/admin/dashboard" replace />;
      } else if (user.role === 'MENTOR' || user.role === 'BOTH') {
        return <Navigate to="/mentor-dashboard" replace />;
      } else {
        return <Navigate to="/dashboard" replace />;
      }
    }

    return children;

  } catch (e) {
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }
}