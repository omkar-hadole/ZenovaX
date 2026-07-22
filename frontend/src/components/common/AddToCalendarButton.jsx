import React, { useState, useRef, useEffect } from 'react';
import { CalendarPlus, Download, ExternalLink } from 'lucide-react';
import { downloadICS, getGoogleCalendarUrl } from '../../utils/calendarExport';

export default function AddToCalendarButton({ session, variant = 'default', className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDownloadICS = (e) => {
        e.stopPropagation();
        downloadICS(session);
        setIsOpen(false);
    };

    const handleGoogleCalendar = (e) => {
        e.stopPropagation();
        window.open(getGoogleCalendarUrl(session), '_blank', 'noopener,noreferrer');
        setIsOpen(false);
    };

    const menu = isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 py-1">
            <button
                onClick={handleDownloadICS}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
                <Download className="w-4 h-4 text-gray-400 dark:text-gray-500" /> Download .ics
            </button>
            <button
                onClick={handleGoogleCalendar}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
                <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500" /> Add to Google Calendar
            </button>
        </div>
    );

    if (variant === 'icon') {
        return (
            <div className="relative inline-block" ref={ref}>
                <button
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    title="Add to Calendar"
                    aria-label="Add to Calendar"
                    className={`p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0 ${className}`}
                >
                    <CalendarPlus className="w-4 h-4" />
                </button>
                {menu}
            </div>
        );
    }

    return (
        <div className={`relative ${className}`} ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
                <CalendarPlus className="w-4 h-4" /> Add to Calendar
            </button>
            {menu}
        </div>
    );
}
