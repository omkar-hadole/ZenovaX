import { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * Light/Dark theme provider. Sets `data-theme` on <html>, which selects the
 * matching token block in index.css (:root/[data-theme="light"] vs
 * [data-theme="dark"]) and the Tailwind `dark:` variant (see the
 * `@custom-variant dark` rule in index.css, which keys off this same
 * attribute instead of the OS-only media query).
 *
 * Falls back to the OS `prefers-color-scheme` when the user hasn't picked
 * a theme yet; once they toggle, that explicit choice is persisted and
 * wins over the OS setting from then on.
 */
const ThemeContext = createContext(null);

const STORAGE_KEY = 'zenovax-theme';

const getSystemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export function ThemeProvider({ children, defaultTheme }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return defaultTheme || 'light';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored;
    } catch {
      /* ignore storage failures */
    }
    return defaultTheme || getSystemTheme();
  });

  // Follow the OS preference live, but only until the user makes an explicit
  // choice — once they do, localStorage takes over and this stops applying.
  useEffect(() => {
    let hasStoredChoice = false;
    try {
      hasStoredChoice = !!localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (hasStoredChoice) return undefined;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setThemeState(e.matches ? 'dark' : 'light');
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage failures */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Safe fallback so the homepage works even without a provider mounted.
    return { theme: 'light', setTheme: () => {}, toggleTheme: () => {} };
  }
  return ctx;
};
