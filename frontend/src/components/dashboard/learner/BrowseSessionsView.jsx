import React from 'react';
import { Calendar, Clock } from 'lucide-react';

import SessionSkeleton from '../SessionSkeleton';
import SessionCard from './SessionCard';

export default function BrowseSessionsView({
    sessions,
    isLoading,
    setSelectedSession,
    currentPage,
    totalPages,
    onPageChange,
    filterType,
    setFilterType,
    filters,
    setFilters
}) {
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Browse Sessions</h2>

                <div className="flex items-center gap-4">
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center">
                        <button
                            onClick={() => setFilterType('upcoming')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'upcoming'
                                ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setFilterType('past')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'past'
                                ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                }`}
                        >
                            Past
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={filters?.mode || ''}
                            onChange={(e) => handleFilterChange('mode', e.target.value)}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center min-w-[100px]"
                            style={{ backgroundImage: 'none' }}
                        >
                            <option value="">All Modes</option>
                            <option value="ONLINE">Online</option>
                            <option value="OFFLINE">Offline</option>
                        </select>

                        <select
                            value={filters?.priceType || ''}
                            onChange={(e) => handleFilterChange('priceType', e.target.value)}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center min-w-[100px]"
                            style={{ backgroundImage: 'none' }}
                        >
                            <option value="">All Prices</option>
                            <option value="FREE">Free</option>
                            <option value="PAID">Paid</option>
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <SessionSkeleton key={i} />)}
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No sessions found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Check back later for upcoming sessions.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map((session) => {
                            const isSessionEnded = new Date(new Date(session.scheduledAt).getTime() + session.duration * 60000) < new Date();
                            return (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    footer={
                                        <>
                                            <div className="text-sm">
                                                <span className="font-bold text-gray-800 dark:text-gray-100">{session.duration}</span>
                                                <span className="text-gray-500 dark:text-gray-400"> min</span>
                                            </div>
                                            <button
                                                onClick={() => setSelectedSession(session)}
                                                disabled={!session.isBooked && isSessionEnded}
                                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all transform hover:-translate-y-0.5 ${session.isBooked
                                                    ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20'
                                                    : isSessionEnded
                                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed hover:translate-y-0'
                                                        : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 hover:shadow-lg'
                                                    }`}
                                            >
                                                {session.isBooked ? 'Registered' : isSessionEnded ? 'Registration Closed' : 'Register'}
                                            </button>
                                        </>
                                    }
                                />
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center pt-8 gap-2">
                            <button
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${currentPage === pageNum
                                        ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg dark:shadow-none scale-110'
                                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
