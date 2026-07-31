import * as Sentry from '@sentry/react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.browserTracingIntegration()],
});

const RootErrorFallback = () => (
  <div className="flex justify-center items-center h-screen bg-[#F5F6FA] dark:bg-gray-950">
    <div className="text-center max-w-md p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Something went wrong</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        An unexpected error occurred. Please try refreshing the page.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-[#7A79E6] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#6c6bd6] transition-colors"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

document.addEventListener('wheel', (e) => {
  if (e.target instanceof HTMLInputElement && e.target.type === 'number') {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Outside the error boundary so the theme attribute is set on <html>
        even if something inside crashes — RootErrorFallback stays themed. */}
    <ThemeProvider>
      <Sentry.ErrorBoundary fallback={<RootErrorFallback />}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Sentry.ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)
