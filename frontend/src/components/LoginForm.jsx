import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { login as apiLogin, apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginForm({ onToggle, showToast }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const validateEmail = (email) => {
    return email.endsWith('@nst.rishihood.edu.in') && email.includes('@');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      showToast({ message: 'Email must end with @nst.rishihood.edu.in', type: 'error' });
      return;
    }

    if (formData.password.length < 6) {
      showToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setLoading(true);
    setNeedsVerification(false);

    try {
      const data = await apiLogin(formData.email, formData.password);
      login(data.user);
      showToast({ message: 'Login successful!', type: 'success' });

      if (!data.user.isProfileComplete) {
        navigate('/complete-profile');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'MENTOR' || data.user.role === 'BOTH') {
        navigate('/mentor/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.needsVerification) {
        setNeedsVerification(true);
        showToast({ message: 'Please verify your email first.', type: 'error' });
      } else {
        showToast({ message: err.message || 'Network error', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      await apiCall('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: formData.email })
      });
      showToast({ message: 'Verification email resent!', type: 'success' });
      setNeedsVerification(false); // Reset state
    } catch (err) {
      showToast({ message: err.message || 'Failed to resend email.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email not verified</h2>
        <p className="text-gray-600 mb-6">
          Your account is not verified yet. Please check your inbox for the verification link.
        </p>
        <button
          onClick={handleResend}
          disabled={loading}
          className="w-full bg-[#7A79E6] text-white py-3 rounded-xl font-medium hover:bg-[#6c6bd6] transition-colors mb-3"
        >
          {loading ? 'Sending...' : 'Resend Verification Email'}
        </button>
        <button
          onClick={() => setNeedsVerification(false)}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
        Welcome back
      </h2>
      <p className="text-gray-600 mb-8 font-light">
        Don't have an account?{' '}
        <button
          onClick={onToggle}
          className="text-blue-600 hover:text-blue-700 font-normal"
        >
          Sign up
        </button>
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="sr-only">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="Email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input-glass w-full px-4 py-3.5 text-gray-900 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
          />
          <p className="text-xs text-gray-500 mt-2 font-light">
            Must end with @nst.rishihood.edu.in
          </p>
        </div>

        <div className="relative">
          <label htmlFor="login-password" className="sr-only">Password</label>
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            required
            minLength="6"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input-glass w-full px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center text-gray-600 font-light">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500/30"
            />
            <span className="ml-2">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-light">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-white py-3.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Logging in...</span>
            </>
          ) : (
            <span>Log in</span>
          )}
        </button>
      </form>
    </div>
  );
}