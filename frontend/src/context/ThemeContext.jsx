import { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * Lightweight theme scaffold for a FUTURE Light/Dark toggle.
 *
 * Only the Light theme is designed/built today. This provider sets
 * `data-theme` on <html>, which selects the matching token block in
 * index.css (:root/[data-theme="light"] vs the [data-theme="dark"]
 * placeholder). Because every component consumes CSS-variable tokens,
 * enabling Dark later requires no JSX changes — only filling in the
 * dark token values and exposing a UI control that calls `setTheme`.
 */
const ThemeContext = createContext(null);

const STORAGE_KEY = 'zenovax-theme';

export function ThemeProvider({ children, defaultTheme = 'light' }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return localStorage.getItem(STORAGE_KEY) || defaultTheme;
  });

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
