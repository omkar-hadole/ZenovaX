import React from 'react';
import { Calendar, Clock } from 'lucide-react';

import SessionSkeleton from '../SessionSkeleton';

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
                <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Browse Sessions</h2>

                <div className="flex items-center gap-4">
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                        <button
                            onClick={() => setFilterType('upcoming')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'upcoming'
                                ? 'bg-white text-black shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setFilterType('past')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filterType === 'past'
                                ? 'bg-white text-black shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Past
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={filters?.mode || ''}
                            onChange={(e) => handleFilterChange('mode', e.target.value)}
                            className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer hover:bg-gray-50 transition-colors text-center min-w-[100px]"
                            style={{ backgroundImage: 'none' }}
                        >
                            <option value="">All Modes</option>
                            <option value="ONLINE">Online</option>
                            <option value="OFFLINE">Offline</option>
                        </select>

                        <select
                            value={filters?.priceType || ''}
                            onChange={(e) => handleFilterChange('priceType', e.target.value)}
                            className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer hover:bg-gray-50 transition-colors text-center min-w-[100px]"
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
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No sessions found</h3>
                    <p className="text-gray-500">Check back later for upcoming sessions.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map((session) => (
                            <div key={session.id} className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
                                            {session.mentor?.profilePicture ? (
                                                <img src={session.mentor.profilePicture} alt={session.mentor.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-[#A9C1F7]/20 text-[#5B8DEF] font-bold text-lg">
                                                    {session.mentor?.name?.[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">{session.mentor?.name}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{session.mentor?.department || 'Mentor'}</p>
                                        </div>
                                    </div>
                                    <span className="bg-[#F5F6FA] text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-black/5">
                                        {session.mode}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{session.title}</h3>
                                <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">{session.description || 'Join this session to learn more.'}</p>

                                <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 bg-[#F5F6FA] p-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{new Date(session.scheduledAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="w-px h-4 bg-gray-300" />
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium">{new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                    <div className="text-sm">
                                        <span className="font-bold text-gray-800">{session.duration}</span>
                                        <span className="text-gray-500"> min</span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSession(session)}
                                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all transform hover:-translate-y-0.5 ${session.isBooked
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg'
                                            }`}
                                    >
                                        {session.isBooked ? 'Registered' : 'Register'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center pt-8 gap-2">
                            <button
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => onPageChange(pageNum)}
                                    className={`w-10 h-10 rounded-xl text-sm font-bold flex items-center justify-center transition-all ${currentPage === pageNum
                                        ? 'bg-black text-white shadow-lg scale-110'
                                        : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-600'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
