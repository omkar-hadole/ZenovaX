import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Shared light/dark toggle button, used in both the marketing Navbar and
 * the dashboard Header. `variant` adapts the styling to each surface —
 * the marketing nav sits on translucent/blurred glass, the dashboard
 * header sits on a flat surface — without duplicating the toggle logic.
 */
export default function ThemeToggle({ variant = 'dashboard', className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const base =
    'relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2';

  const variantClasses =
    variant === 'marketing'
      ? 'text-text-muted hover:text-text hover:bg-accent-tint focus-visible:outline-accent'
      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm focus-visible:outline-gray-400';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`${base} ${variantClasses} ${className}`}
    >
      <Sun
        className={`absolute w-5 h-5 transition-all duration-300 ${isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <Moon
        className={`absolute w-5 h-5 transition-all duration-300 ${isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'}`}
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </button>
  );
}
