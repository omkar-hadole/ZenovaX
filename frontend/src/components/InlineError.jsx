import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function InlineError({ message = "Failed to load data", onRetry, className = "" }) {
    return (
        <div className={`flex flex-col items-center justify-center p-6 bg-red-50/40 rounded-2xl border border-red-100/60 text-center animate-in fade-in duration-300 ${className}`}>
            <div className="w-10 h-10 bg-red-100/80 text-red-600 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                <AlertCircle size={20} />
            </div>
            <p className="text-gray-700 font-medium text-sm mb-3">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95 hover:shadow-md"
                >
                    <RotateCcw size={12} className="animate-hover-spin" />
                    Retry
                </button>
            )}
        </div>
    );
}
