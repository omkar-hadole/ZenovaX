import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function InlineError({ message = "Failed to load data", onRetry, className = "" }) {
    return (
        <div className={`flex flex-col items-center justify-center p-6 bg-red-50/40 dark:bg-red-500/5 rounded-2xl border border-red-100/60 dark:border-red-500/20 text-center animate-in fade-in duration-300 ${className}`}>
            <div className="w-10 h-10 bg-red-100/80 dark:bg-red-500/15 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                <AlertCircle size={20} />
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium text-sm mb-3">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 hover:shadow-md"
                >
                    <RotateCcw size={12} className="animate-hover-spin" />
                    Retry
                </button>
            )}
        </div>
    );
}
