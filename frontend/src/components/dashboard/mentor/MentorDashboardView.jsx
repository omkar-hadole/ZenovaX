import React from 'react';
import { Calendar, Users, Clock, Star, TrendingUp, PlayCircle } from 'lucide-react';
import StatsCard from '../StatsCard';
import SessionRequests from './SessionRequests';
import QuickActions from './QuickActions';
import RatingSummary from './RatingSummary';
import RecentActivity from './RecentActivity';
import DashboardSkeleton from '../DashboardSkeleton';
import InlineError from '../../InlineError';

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
    if (loading) return <DashboardSkeleton />;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {errors.stats ? (
                <InlineError message={errors.stats} onRetry={onRetryStats} className="mb-8" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { icon: Calendar, label: 'Total Sessions', value: stats.totalSessions, bg: 'bg-[#C9C7F5]', text: 'text-[#5a59b5]', border: 'border-[#b8b6e5]' },
                        { icon: Users, label: 'Learners Helped', value: stats.totalLearners, bg: 'bg-[#A9C1F7]', text: 'text-[#4a7ac7]', border: 'border-[#98b0e5]' },
                        { icon: Clock, label: 'Total Hours', value: `${stats.totalHours}h`, bg: 'bg-[#F7D483]', text: 'text-[#b59a5a]', border: 'border-[#e5c372]' },
                        { icon: Star, label: 'Average Rating', value: stats.averageRating?.toFixed(1) || '0.0', bg: 'bg-[#C9C7F5]', text: 'text-[#5a59b5]', border: 'border-[#b8b6e5]' }
                    ].map((stat, index) => (
                        <div key={index} className={`rounded-2xl p-6 shadow-sm border ${stat.bg}/20 ${stat.border} flex items-center gap-4 hover:shadow-md transition-all duration-300 hover:-translate-y-1`}>
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center text-white shadow-sm`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Upcoming Sessions</h3>
                            <button
                                onClick={() => setActiveTab('My Sessions')}
                                className="text-sm text-[#5a59b5] bg-[#C9C7F5]/20 px-4 py-2 rounded-lg hover:bg-[#C9C7F5]/40 transition-colors font-medium"
                            >
                                View All
                            </button>
                        </div>

                        {errors.sessions ? (
                            <InlineError message={errors.sessions} onRetry={onRetrySessions} className="py-8 bg-white border border-gray-100 shadow-sm" />
                        ) : (
                            <div className="space-y-4">
                                {mySessions.filter(s => new Date(s.scheduledAt) > new Date()).length > 0 ? (
                                    <>
                                        {mySessions.filter(s => new Date(s.scheduledAt) > new Date()).slice(0, 1).map(session => (
                                            <div key={session.id} className="bg-gradient-to-br from-[#7A79E6] to-[#5a59b5] rounded-2xl p-6 text-white relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                                Next Session
                                                            </span>
                                                            <span className="text-white/80 text-sm font-medium">
                                                                {new Date(session.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-2xl font-bold mb-2">{session.title}</h3>
                                                        <div className="flex items-center gap-4 text-white/90 text-sm">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock size={16} />
                                                                <span>{new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <Users size={16} />
                                                                <span>{session._count?.bookings || 0} registered</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button className="bg-white text-[#7A79E6] px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
                                                        <PlayCircle size={20} />
                                                        Start Session
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {mySessions.filter(s => new Date(s.scheduledAt) > new Date()).slice(1, 3).map((session) => (
                                            <div key={session.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all duration-300">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-[#7A79E6]/5 rounded-xl flex flex-col items-center justify-center text-[#7A79E6] border border-[#7A79E6]/10">
                                                        <span className="text-xs font-bold uppercase">{new Date(session.scheduledAt).toLocaleDateString(undefined, { month: 'short' })}</span>
                                                        <span className="text-xl font-bold leading-none">{new Date(session.scheduledAt).getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 text-base">{session.title}</h4>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Clock size={14} />
                                                                {new Date(session.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                            <span>{session.duration} min</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="text-gray-400 hover:text-[#7A79E6] p-2 rounded-full hover:bg-[#7A79E6]/5 transition-colors">
                                                    <PlayCircle size={24} />
                                                </button>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                            <Calendar size={24} />
                                        </div>
                                        <h3 className="text-gray-900 font-medium mb-1">No upcoming sessions</h3>
                                        <p className="text-gray-500 text-sm">Schedule a new session to get started.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>

                    {errors.requests ? (
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Session Request Status</h3>
                            </div>
                            <InlineError message={errors.requests} onRetry={onRetryRequests} className="py-8 bg-white border border-gray-100 shadow-sm" />
                        </section>
                    ) : (
                        <SessionRequests requests={sessionRequests} />
                    )}
                </div>

                <div className="space-y-6">
                    <QuickActions />
                    <RatingSummary stats={reviewStats} />
                    <RecentActivity />
                </div>
            </div>
        </div>
    );
}
