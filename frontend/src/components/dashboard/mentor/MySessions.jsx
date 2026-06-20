import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Calendar, Clock, Users, Filter, MoreVertical, Edit } from 'lucide-react';

export default function MySessions({ sessions }) {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('All Status');

    const filteredSessions = sessions.filter(session => {
        if (filter === 'All Status') return true;
        if (filter === 'Upcoming') return new Date(session.scheduledAt) > new Date();
        if (filter === 'Completed') return new Date(session.scheduledAt) <= new Date();
        return true;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">My Sessions</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage and track your upcoming mentorship sessions</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C9C7F5] focus:border-transparent appearance-none cursor-pointer hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <option>All Status</option>
                            <option>Upcoming</option>
                            <option>Completed</option>
                        </select>
                    </div>
                    <button
                        onClick={() => navigate('/mentor/create-session')}
                        className="bg-[#C9C7F5] text-[#5a59b5] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#b8b6e5] transition-colors shadow-sm"
                    >
                        + New Session
                    </button>
                </div>
            </div>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.length > 0 ? (
                    filteredSessions.map((session) => (
                        <div key={session.id} className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">

                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${session.mode === 'ONLINE'
                                    ? 'bg-[#A9C1F7]/10 text-[#4a7ac7]'
                                    : 'bg-[#F7D483]/10 text-[#b59a5a]'
                                    }`}>
                                    {session.mode}
                                </div>
                                <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 transition-colors">
                                    <MoreVertical size={16} />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-[#5a59b5] transition-colors">
                                {session.title}
                            </h3>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar size={16} className="text-[#C9C7F5]" />
                                    <span>{new Date(session.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Clock size={16} className="text-[#A9C1F7]" />
                                    <span>{new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} • {session.duration} min</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-gray-500 font-medium">Registrations</span>
                                    <span className="text-gray-900 font-bold">{session._count?.bookings || 0}/{session.maxSeats}</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(((session._count?.bookings || 0) / session.maxSeats) * 100, 100)}%`,
                                            backgroundColor: session.mode === 'ONLINE' ? '#A9C1F7' : '#F7D483'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-auto">
                                {session.isRequest ? (
                                    <>
                                        <button
                                            onClick={() => navigate(`/mentor/edit-session/${session.id.replace('req-', '')}`)}
                                            className="flex-1 bg-yellow-50 text-yellow-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-yellow-100 transition-colors flex items-center justify-center gap-2 border border-yellow-200"
                                        >
                                            <Edit size={18} />
                                            Edit Request
                                        </button>
                                        <div className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-400 bg-gray-50 border border-gray-100 flex items-center gap-2 cursor-help" title="Waiting for admin approval">
                                            <Clock size={16} />
                                            Pending
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <button className="flex-1 bg-[#C9C7F5]/20 text-[#5a59b5] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#C9C7F5]/40 transition-colors flex items-center justify-center gap-2">
                                            <PlayCircle size={18} />
                                            Start
                                        </button>
                                        <button
                                            onClick={() => navigate(`/mentor/session/${session.id}`)}
                                            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                        >
                                            Details
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-white rounded-[1.5rem] border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Calendar size={24} />
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">No sessions found</h3>
                        <p className="text-gray-500 text-sm">Try changing the filter or create a new session.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
