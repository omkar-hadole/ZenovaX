import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, Star, TrendingUp, PlayCircle, Video, MapPin } from 'lucide-react';
import StatsCard from '../StatsCard';
import SessionRequests from './SessionRequests';
import QuickActions from './QuickActions';
import RatingSummary from './RatingSummary';
import FeedbackActions from './FeedbackActions';
import DashboardSkeleton from '../DashboardSkeleton';
import InlineError from '../../InlineError';

function getSessionLiveState(session) {
    const now = new Date();
    const start = new Date(session.scheduledAt);
    const end = new Date(start.getTime() + (session.duration || 0) * 60000);
    return {
        isLive: now >= start && now < end,
        isLinkActive: now >= new Date(start.getTime() - 15 * 60 * 1000),
    };
}

export default function MentorDashboardView({
    stats,
    mySessions,
    sessionRequests,
    reviewStats,
    setActiveTab,
    loading,
    errors = {},
    onRetrySessions,
    onRetryRequests,
    onRetryStats
}) {
    const navigate = useNavigate();

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {errors.stats ? (
                <InlineError message={errors.stats} onRetry={onRetryStats} className="mb-8" />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                    {[
                        { icon: Calendar, label: 'Total Sessions', value: stats.totalSessions, bg: 'bg-[#C9C7F5]', text: 'text-[#5a59b5]', border: 'border-[#b8b6e5]' },
                        { icon: Users, label: 'Learners Helped', value: stats.totalLearners, bg: 'bg-[#A9C1F7]', text: 'text-[#4a7ac7]', border: 'border-[#98b0e5]' },
                        { icon: Clock, label: 'Total Hours', value: `${stats.totalHours}h`, bg: 'bg-[#F7D483]', text: 'text-[#b59a5a]', border: 'border-[#e5c372]' },
                        { icon: Star, label: 'Average Rating', value: stats.averageRating?.toFixed(1) || '0.0', bg: 'bg-[#C9C7F5]', text: 'text-[#5a59b5]', border: 'border-[#b8b6e5]' }
                    ].map((stat, index) => (
                        <div key={index} className={`rounded-2xl p-4 sm:p-6 shadow-sm border ${stat.bg}/20 ${stat.border} flex items-center gap-3 sm:gap-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1`}>
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bg} flex items-center justify-center text-white shadow-sm shrink-0`}>
                                <stat.icon size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium truncate">{stat.label}</p>
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Upcoming Sessions</h3>
                            <button
                                onClick={() => setActiveTab('My Sessions')}
                                className="text-sm text-[#5a59b5] bg-[#C9C7F5]/20 px-4 py-2 rounded-lg hover:bg-[#C9C7F5]/40 transition-colors font-medium"
                            >
                                View All
                            </button>
                        </div>

                        {errors.sessions ? (
                            <InlineError message={errors.sessions} onRetry={onRetrySessions} className="py-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm" />
                        ) : (
                            <div className="space-y-4">
                                {(() => {
                                    const upcomingSessions = mySessions
                                        .filter(s => new Date(s.scheduledAt) > new Date())
                                        .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
                                    const [heroSession, ...restSessions] = upcomingSessions;

                                    return upcomingSessions.length > 0 ? (
                                        <>
                                            {(() => {
                                                const { isLive, isLinkActive } = getSessionLiveState(heroSession);
                                                return (
                                                    <div
                                                        onClick={() => navigate(`/mentor/session/${heroSession.id}`)}
                                                        className="bg-gradient-to-br from-[#7A79E6] to-[#5a59b5] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                                                    >
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                                                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                                        Next Session
                                                                    </span>
                                                                    {isLive && (
                                                                        <span className="flex items-center gap-1.5 bg-red-500/90 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                                                            Live Now
                                                                        </span>
                                                                    )}
                                                                    <span className="flex items-center gap-1 text-white/80 text-xs font-bold uppercase tracking-wider">
                                                                        {heroSession.mode === 'ONLINE' ? <Video size={12} /> : <MapPin size={12} />}
                                                                        {heroSession.mode}
                                                                    </span>
                                                                    <span className="text-white/80 text-sm font-medium">
                                                                        {new Date(heroSession.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                </div>
                                                                <h3 className="text-2xl font-bold mb-2 truncate">{heroSession.title}</h3>
                                                                <div className="flex items-center gap-4 text-white/90 text-sm">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Clock size={16} />
                                                                        <span>{new Date(heroSession.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Users size={16} />
                                                                        <span>{heroSession._count?.bookings || 0} registered</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {heroSession.mode === 'OFFLINE' ? (
                                                                <div className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-center whitespace-nowrap">
                                                                    In-Person Session
                                                                </div>
                                                            ) : isLinkActive ? (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); window.open(`/session/${heroSession.id}/live`, '_blank'); }}
                                                                    className="bg-white text-[#7A79E6] px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                                                                >
                                                                    <PlayCircle size={20} />
                                                                    Start Session
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    disabled
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    title="Activates 15 minutes before the session starts"
                                                                    className="bg-white/10 text-white/70 px-6 py-3 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
                                                                >
                                                                    <Clock size={20} />
                                                                    Starts Soon
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {restSessions.slice(0, 2).map((session) => {
                                                const { isLive, isLinkActive } = getSessionLiveState(session);
                                                return (
                                                    <div
                                                        key={session.id}
                                                        onClick={() => navigate(`/mentor/session/${session.id}`)}
                                                        className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 hover:shadow-md transition-all duration-300 cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <div className="w-14 h-14 flex-shrink-0 bg-[#7A79E6]/5 rounded-xl flex flex-col items-center justify-center text-[#7A79E6] border border-[#7A79E6]/10">
                                                                <span className="text-xs font-bold uppercase">{new Date(session.scheduledAt).toLocaleDateString(undefined, { month: 'short' })}</span>
                                                                <span className="text-xl font-bold leading-none">{new Date(session.scheduledAt).getDate()}</span>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg truncate">{session.title}</h4>
                                                                    {isLive && (
                                                                        <span className="flex items-center gap-1 flex-shrink-0 text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Live
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock size={14} />
                                                                        {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                    </span>
                                                                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
                                                                    <span className="flex-shrink-0">{session.duration} min</span>
                                                                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full flex-shrink-0" />
                                                                    <span className="flex items-center gap-1 flex-shrink-0">
                                                                        {session.mode === 'ONLINE' ? <Video size={14} /> : <MapPin size={14} />}
                                                                        {session.mode === 'ONLINE' ? 'Online' : 'In-person'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {session.mode === 'ONLINE' && isLinkActive ? (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); window.open(`/session/${session.id}/live`, '_blank'); }}
                                                                title="Join live session"
                                                                className="text-[#7A79E6] hover:text-[#5a59b5] p-2 rounded-full hover:bg-[#7A79E6]/5 transition-colors flex-shrink-0"
                                                            >
                                                                <PlayCircle size={24} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                disabled
                                                                onClick={(e) => e.stopPropagation()}
                                                                title={session.mode === 'OFFLINE' ? 'In-person session' : 'Activates 15 minutes before the session starts'}
                                                                className="text-gray-300 dark:text-gray-600 p-2 rounded-full cursor-not-allowed flex-shrink-0"
                                                            >
                                                                <PlayCircle size={24} />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 border-dashed">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500">
                                                <Calendar size={24} />
                                            </div>
                                            <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No upcoming sessions</h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">Schedule a new session to get started.</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </section>

                    {errors.requests ? (
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Session Request Status</h3>
                            </div>
                            <InlineError message={errors.requests} onRetry={onRetryRequests} className="py-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm" />
                        </section>
                    ) : (
                        <SessionRequests requests={sessionRequests} />
                    )}
                </div>

                <div className="space-y-6">
                    <QuickActions />
                    <RatingSummary stats={reviewStats} />
                    <FeedbackActions />
                </div>
            </div>
        </div>
    );
}
