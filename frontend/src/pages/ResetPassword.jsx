import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { apiCall } from '../utils/api';
import Toast from '../components/Toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!token) {
      setToast({ message: 'Invalid or missing reset token.', type: 'error' });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setToast({ message: 'Cannot reset password without a valid token.', type: 'error' });
      return;
    }

    if (formData.password.length < 8) {
      setToast({ message: 'Password must be at least 8 characters long', type: 'error' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      await apiCall('/auth/reset-password', {
        method: 'POST',
        body: {
          token,
          password: formData.password
        }
      });
      setSuccess(true);
      setToast({ message: 'Password reset successful!', type: 'success' });
      
      // Redirect after a short delay so the user sees the success state
      setTimeout(() => {
        navigate('/auth?mode=login');
      }, 2000);
    } catch (err) {
      setToast({ message: err.message || 'Failed to reset password. Link may be expired.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 min-h-screen flex items-center justify-center p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-md bg-white/50 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 p-8 md:p-10">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Reset Password
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 font-light leading-relaxed">
          {success
            ? 'Your password has been updated. Redirecting you to login page...'
            : 'Enter and confirm your new password below. Must be at least 8 characters long.'}
        </p>

        {success ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 dark:text-green-400 mb-4 animate-bounce" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Password Reset Successful</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
              You can now sign in with your new credentials.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label htmlFor="reset-password" className="sr-only">New password</label>
              <input
                id="reset-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                required
                minLength="8"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-glass w-full px-4 py-3.5 pr-12 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="reset-confirm-password" className="sr-only">Confirm new password</label>
              <input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm New Password"
                required
                minLength="8"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input-glass w-full px-4 py-3.5 pr-12 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showConfirmPassword}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="btn-primary w-full text-white py-3.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
            <Link
              to="/auth?mode=login"
              className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
