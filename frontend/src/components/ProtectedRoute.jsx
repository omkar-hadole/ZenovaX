import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
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
  } catch (e) {
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }

  return children;
}