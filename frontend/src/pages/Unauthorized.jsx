import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldOff, Home, LogIn, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const userRole = location.state?.userRole || user?.role;
  const from = location.state?.from?.pathname;

  const handleGoHome = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role === 'ADMIN') navigate('/admin/dashboard');
    else if (user.role === 'MENTOR' || user.role === 'BOTH') navigate('/mentor-dashboard');
    else navigate('/dashboard');
  };

  const handleGoToLogin = async () => {
    await logout();
    navigate('/auth');
  };

  const handleRetry = () => {
    if (from) {
      navigate(from, { replace: true });
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 md:p-12">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldOff className="w-10 h-10 text-red-500" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>

          <p className="text-gray-500 mb-2">
            You don't have permission to access this page.
          </p>

          {userRole && (
            <p className="text-sm text-gray-400 mb-8">
              Your role: <span className="font-medium text-gray-600">{userRole}</span>
            </p>
          )}

          {!user && (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-4 py-3 mb-8">
              Your session has expired. Please sign in again.
            </p>
          )}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#7A79E6] text-white rounded-xl font-medium hover:bg-[#6c6bd6] transition-colors"
            >
              <Home className="w-4 h-4" />
              {user ? 'Go to Dashboard' : 'Go Home'}
            </button>

            {!user && (
              <button
                onClick={handleGoToLogin}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}

            {from && (
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
