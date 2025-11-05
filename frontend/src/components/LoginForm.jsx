import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { login } from '../utils/api';

export default function LoginForm({ onToggle, showToast }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

    try {
      const data = await login(formData.email, formData.password);
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast({ message: 'Login successful!', type: 'success' });
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 600);
    } catch (err) {
      showToast({ message: err.message || 'Network error', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

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
          <input
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
          <input
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
          <a href="#" className="text-blue-600 hover:text-blue-700 font-light">
            Forgot password?
          </a>
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