import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Calendar, Clock, Users, MoreVertical, Edit, Search, Video } from 'lucide-react';
import AddToCalendarButton from '../../common/AddToCalendarButton';
import Pagination from '../../common/Pagination';

const ITEMS_PER_PAGE = 9;

const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
];

function SessionCardMenu({ onEdit }) {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                aria-label="Session options"
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
                <MoreVertical size={16} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-20 py-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); onEdit(); }}
                        className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                        <Edit size={14} className="text-gray-400 dark:text-gray-500" /> Edit Session
                    </button>
                </div>
            )}
        </div>
    );
}

export default function MySessions({ sessions }) {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('all');
    const [modeFilter, setModeFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [page, setPage] = useState(1);

    const filteredSessions = useMemo(() => sessions.filter(session => {
        const matchesStatus = statusFilter === 'all'
            || (statusFilter === 'upcoming' && new Date(session.scheduledAt) > new Date())
            || (statusFilter === 'completed' && new Date(session.scheduledAt) <= new Date());
        const matchesMode = !modeFilter || session.mode === modeFilter;
        const matchesSearch = !searchInput.trim() || session.title?.toLowerCase().includes(searchInput.trim().toLowerCase());
        return matchesStatus && matchesMode && matchesSearch;
    }), [sessions, statusFilter, modeFilter, searchInput]);

    const totalPages = Math.max(1, Math.ceil(filteredSessions.length / ITEMS_PER_PAGE));
    const validPage = Math.min(page, totalPages);
    const paginatedSessions = filteredSessions.slice(
        (validPage - 1) * ITEMS_PER_PAGE,
        validPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setPage(1);
    }, [statusFilter, modeFilter, searchInput]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">My Sessions</h2>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setStatusFilter(f.value)}
                                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === f.value
                                    ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value)}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center min-w-[100px]"
                        style={{ backgroundImage: 'none' }}
                    >
                        <option value="">All Modes</option>
                        <option value="ONLINE">Online</option>
                        <option value="OFFLINE">Offline</option>
                    </select>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search sessions..."
                            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#C9C7F5] outline-none border-none w-full sm:w-64"
                        />
                    </div>

                    <button
                        onClick={() => navigate('/mentor/create-session')}
                        className="bg-[#C9C7F5] text-[#5a59b5] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#b8b6e5] transition-colors shadow-sm whitespace-nowrap"
                    >
                        + New Session
                    </button>
                </div>
            </div>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedSessions.length > 0 ? (
                    paginatedSessions.map((session) => {
                        const now = new Date();
                        const start = new Date(session.scheduledAt);
                        const end = new Date(start.getTime() + (session.duration || 0) * 60000);
                        const isLive = now >= start && now < end;
                        const isCompleted = session.status === 'COMPLETED' || end < now;
                        const isLinkActive = now >= new Date(start.getTime() - 15 * 60 * 1000);
                        const seatsFilled = session._count?.bookings || 0;
                        const seatsPercent = session.maxSeats
                            ? Math.min((seatsFilled / session.maxSeats) * 100, 100)
                            : 0;

                        return (
                            <div
                                key={session.id}
                                className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${session.mode === 'ONLINE'
                                            ? 'bg-[#A9C1F7]/10 text-[#4a7ac7]'
                                            : 'bg-[#F7D483]/10 text-[#b59a5a]'
                                            }`}>
                                            {session.mode}
                                        </div>
                                        {isLive && !session.isRequest && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400">
                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                Live Now
                                            </div>
                                        )}
                                    </div>
                                    {!session.isRequest && (
                                        <SessionCardMenu onEdit={() => navigate(`/mentor/edit-session/${session.id}`)} />
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 line-clamp-1 group-hover:text-[#5a59b5] transition-colors">
                                    {session.title}
                                </h3>

                                <div className="flex items-center gap-4 mb-5 text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1.5 rounded-lg">
                                        <Calendar size={14} className="text-[#C9C7F5]" />
                                        {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1.5 rounded-lg">
                                        <Clock size={14} className="text-[#A9C1F7]" />
                                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })} • {session.duration} min
                                    </div>
                                </div>

                                <div className="mb-6">
                                    {session.isRequest ? (
                                        <div className="flex items-center gap-2 text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-100 dark:border-yellow-500/20">
                                            <Clock size={14} />
                                            Awaiting admin approval
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
                                                    <Users size={13} /> Registrations
                                                </span>
                                                <span className="text-gray-900 dark:text-gray-100 font-bold">{seatsFilled}/{session.maxSeats ?? '—'}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${seatsPercent}%`,
                                                        backgroundColor: session.mode === 'ONLINE' ? '#A9C1F7' : '#F7D483'
                                                    }}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-auto">
                                    {session.isRequest ? (
                                        <>
                                            <button
                                                onClick={() => navigate(`/mentor/edit-session/${session.id.replace('req-', '')}`)}
                                                className="flex-1 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-2 border border-yellow-200 dark:border-yellow-500/20"
                                            >
                                                <Edit size={18} />
                                                Edit Request
                                            </button>
                                            <div className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex items-center gap-2 cursor-help" title="Waiting for admin approval">
                                                <Clock size={16} />
                                                Pending
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {isCompleted ? (
                                                <button
                                                    disabled
                                                    className="flex-1 bg-gray-50 dark:bg-gray-800/60 text-gray-400 dark:text-gray-500 px-4 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    Session Completed
                                                </button>
                                            ) : session.mode === 'OFFLINE' ? (
                                                <div className="flex-1 text-center bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 px-4 py-2.5 rounded-xl text-sm font-bold">
                                                    In-Person Session
                                                </div>
                                            ) : isLinkActive ? (
                                                <button
                                                    onClick={() => window.open(`/session/${session.id}/live`, '_blank')}
                                                    className="flex-1 bg-[#C9C7F5]/20 text-[#5a59b5] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#C9C7F5]/40 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <PlayCircle size={18} />
                                                    Start
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    title="Activates 15 minutes before the session starts"
                                                    className="flex-1 bg-gray-50 dark:bg-gray-800/60 text-gray-400 dark:text-gray-500 px-4 py-2.5 rounded-xl text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    <Video size={18} />
                                                    Starts Soon
                                                </button>
                                            )}
                                            {!isCompleted && (
                                                <AddToCalendarButton session={session} variant="icon" />
                                            )}
                                            <button
                                                onClick={() => navigate(`/mentor/session/${session.id}`)}
                                                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                            >
                                                Details
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-gray-900 rounded-[1.5rem] border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500">
                            <Calendar size={24} />
                        </div>
                        <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No sessions found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Try changing the filter or create a new session.</p>
                    </div>
                )}
            </div>

            <Pagination
                currentPage={validPage}
                totalPages={totalPages}
                onPageChange={(p) => {
                    setPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
            />
        </div>
    );
}
