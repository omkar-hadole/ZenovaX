import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { apiCall } from '../utils/api';
import Toast from '../components/Toast';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);

  const validateEmail = (email) => {
    return email.endsWith('@nst.rishihood.edu.in') && email.includes('@');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setToast({ message: 'Email must end with @nst.rishihood.edu.in', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      await apiCall('/auth/forgot-password', {
        method: 'POST',
        body: { email }
      });
      setSubmitted(true);
      setToast({ message: 'Reset email requested successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Something went wrong.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 min-h-screen flex items-center justify-center p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-md bg-white/50 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 p-8 md:p-10">
        <div className="mb-6 flex justify-start">
          <Link
            to="/auth?mode=login"
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>

        <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Forgot Password
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 font-light leading-relaxed">
          {submitted
            ? 'We have processed your request. Please check your institutional email address for a reset link.'
            : 'Enter your institutional email address and we will send you a secure link to reset your password.'}
        </p>

        {submitted ? (
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 p-5 rounded-2xl mb-8 flex flex-col gap-2">
            <span className="font-medium">Request Sent!</span>
            <span className="text-sm text-emerald-700/95 dark:text-emerald-400/90 font-light">
              If this email exists, a reset link has been sent.
            </span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@nst.rishihood.edu.in"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-glass w-full px-4 py-3.5 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-light">
                Must end with @nst.rishihood.edu.in
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-white py-3.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Requesting Reset...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
            Remembered your password?{' '}
            <Link to="/auth?mode=login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-normal">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
