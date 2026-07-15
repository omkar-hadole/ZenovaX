import React from 'react';
import { AlertOctagon } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-50/50 dark:bg-red-500/5 rounded-[2rem] border border-red-100/80 dark:border-red-500/20 m-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            An unexpected error occurred in this section. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg shadow-gray-400/20 dark:shadow-black/40"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
