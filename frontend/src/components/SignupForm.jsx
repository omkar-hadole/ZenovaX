import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { register } from '../utils/api';

export default function SignupForm({ onToggle, showToast }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email) => {
    return email.endsWith('@nst.rishihood.edu.in') && email.includes('@');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.firstname.length < 2) {
      showToast({ message: 'First name must be at least 2 characters', type: 'error' });
      return;
    }

    if (formData.lastname.length < 2) {
      showToast({ message: 'Last name must be at least 2 characters', type: 'error' });
      return;
    }

    if (!validateEmail(formData.email)) {
      showToast({ message: 'Email must end with @nst.rishihood.edu.in', type: 'error' });
      return;
    }

    const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);
    if (formData.password.length < 8 || !hasNumberOrSpecial) {
      showToast({ message: 'Password must be at least 8 characters and contain at least one number or special character.', type: 'error' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    if (!formData.terms) {
      showToast({ message: 'Please accept terms and conditions', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const name = `${formData.firstname} ${formData.lastname}`;
      await register(name, formData.email, formData.password);
      setSuccess(true);
      showToast({ message: 'Registration successful! Check your email.', type: 'success' });
    } catch (err) {
      showToast({ message: err.message || 'Network error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          We've sent a verification link to <strong>{formData.email}</strong>. Please check your inbox and click the link to activate your account.
        </p>
        <button
          onClick={onToggle}
          className="btn-primary px-8 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-all"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
        Create account
      </h2>
      <p className="text-gray-600 mb-8 font-light">
        Already have an account?{' '}
        <button
          onClick={onToggle}
          className="text-blue-600 hover:text-blue-700 font-normal"
        >
          Log in
        </button>
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="First name"
            required
            minLength="2"
            value={formData.firstname}
            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
            className="input-glass w-full px-4 py-3.5 text-gray-900 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
          />
          <input
            type="text"
            placeholder="Last name"
            required
            minLength="2"
            value={formData.lastname}
            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
            className="input-glass w-full px-4 py-3.5 text-gray-900 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
          />
        </div>

        <div>
          <input
            type="email"
            placeholder="yourname@nst.rishihood.edu.in"
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
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            required
            minLength="8"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="input-glass w-full px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 font-light">
          Must be at least 8 characters and contain at least one number or special character
        </p>

        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            required
            minLength="6"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            className="input-glass w-full px-4 py-3.5 pr-12 text-gray-900 placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-blue-500/30 transition-all duration-300"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <label className="flex items-start text-gray-600 font-light">
          <input
            type="checkbox"
            required
            checked={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500/30"
          />
          <span className="ml-2 text-sm">
            I agree to the{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-normal">
              Terms & Conditions
            </a>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-white py-3.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.01] flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <span>Create account</span>
          )}
        </button>
      </form>
    </div>
  );
}
