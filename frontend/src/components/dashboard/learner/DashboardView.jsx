import React from 'react';
import { Calendar, Clock, Video } from 'lucide-react';
import SessionList from './SessionList';
import DailySchedule from './DailySchedule';
import RecentCourses from './RecentCourses';
import MentorsList from './MentorsList';

export default function DashboardView({
    myBookings,
    sessions,
    mentors,
    setActiveTab,
    setSelectedSession
}) {
    return (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-2 space-y-6">
                <SessionList
                    title="Your Course"
                    sessions={myBookings.slice(0, 3).map(booking => ({
                        id: booking.id,
                        title: booking.title,
                        mentor: booking.mentor?.name,
                        date: `${booking.duration} min`,
                        mode: booking.mode,
                        color: 'bg-blue-100 text-blue-600'
                    }))}
                    type="course"
                    onViewAll={() => setActiveTab('My Bookings')}
                    onSessionClick={(sessionId) => {
                        const session = myBookings.find(b => b.id === sessionId);
                        if (session) setSelectedSession(session);
                    }}
                />
                <DailySchedule bookings={myBookings} />
                <RecentCourses
                    title="Browse Sessions"
                    courses={sessions.filter(s => !s.isBooked).slice(0, 3)}
                    onViewAll={() => setActiveTab('Browse Sessions')}
                    onCourseClick={setSelectedSession}
                />
            </div>

            <div className="space-y-6">
                {(() => {
                    const now = new Date();
                    const currentOrNextSession = sessions.find(s => {
                        const start = new Date(s.scheduledAt);
                        const end = new Date(start.getTime() + s.duration * 60000);
                        return end > now;
                    });

                    if (!currentOrNextSession) return (
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white relative overflow-hidden">
                            <div className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full" />
                            <h3 className="text-xl font-bold mb-2">No Upcoming Classes</h3>
                            <p className="text-gray-400 text-sm">Check back later for new sessions.</p>
                        </div>
                    );

                    const start = new Date(currentOrNextSession.scheduledAt);
                    const isLive = start <= now;
                    const isRegistered = currentOrNextSession.isBooked;

                    return (
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full -ml-10 -mb-10 blur-xl" />

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${isLive ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 text-white backdrop-blur-sm'
                                        }`}>
                                        {isLive ? (
                                            <>
                                                <span className="w-2 h-2 bg-white rounded-full" />
                                                LIVE NOW
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="w-3 h-3" />
                                                UPCOMING
                                            </>
                                        )}
                                    </span>
                                    {isRegistered && (
                                        <span className="bg-green-500/20 text-green-100 border border-green-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                            Registered
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold mb-1 leading-tight">{currentOrNextSession.title}</h3>
                                <p className="text-blue-100 text-sm mb-4 flex items-center gap-2">
                                    by {currentOrNextSession.mentor?.name}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-blue-100 mb-6 bg-white/5 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-300" />
                                        <div className="flex flex-col leading-none">
                                            <span className="text-[10px] text-blue-300 uppercase font-bold">Date</span>
                                            <span className="font-medium">{start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-300" />
                                        <div className="flex flex-col leading-none">
                                            <span className="text-[10px] text-blue-300 uppercase font-bold">Time</span>
                                            <span className="font-medium">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (isRegistered) {
                                            setSelectedSession(currentOrNextSession);
                                        } else {
                                            setSelectedSession(currentOrNextSession);
                                        }
                                    }}
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isRegistered
                                        ? 'bg-white text-blue-600 hover:bg-blue-50'
                                        : 'bg-blue-500 text-white hover:bg-blue-400 border border-blue-400'
                                        }`}
                                >
                                    {isRegistered ? (
                                        <>
                                            <Video className="w-4 h-4" />
                                            {isLive ? 'Join Class Now' : 'View Details'}
                                        </>
                                    ) : (
                                        'Register Now'
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })()}

                <MentorsList mentors={mentors} />

                <SessionList
                    title="Upcoming Classes"
                    sessions={sessions
                        .filter(s => !s.isBooked && new Date(s.scheduledAt) > new Date())
                        .slice(0, 3)
                        .map(session => ({
                            id: session.id,
                            title: session.title,
                            instructor: `By ${session.mentor?.name}`,
                            status: 'Register',
                            color: 'bg-orange-100 text-orange-600'
                        }))}
                    type="class"
                    onViewAll={() => setActiveTab('Browse Sessions')}
                />
            </div>
        </div>
    );
}
