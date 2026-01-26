import React, { useState } from 'react';
import { Calendar, Clock, Settings, QrCode, X } from 'lucide-react';
import SessionSkeleton from '../SessionSkeleton';
import QRCodeGenerator from '../../common/QRCodeGenerator';

export default function MyBookingsView({
    myBookings,
    isLoading,
    setSelectedSession,
    setActiveTab
}) {
    const [showTicket, setShowTicket] = useState(null);

    return (
        <div className="h-full overflow-y-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="mx-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">My Bookings</h2>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <SessionSkeleton key={i} />)}
                    </div>
                ) : myBookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myBookings.map(session => {
                            const now = new Date();
                            const start = new Date(session.scheduledAt);
                            const end = new Date(start.getTime() + session.duration * 60000);

                            let status = 'UPCOMING';
                            let statusColor = 'text-green-600';

                            if (session.status === 'COMPLETED' || end < now) {
                                status = 'COMPLETED';
                                statusColor = 'text-gray-500';
                            } else if (start <= now && end > now) {
                                status = 'LIVE NOW';
                                statusColor = 'text-red-600 animate-pulse';
                            }

                            const showTicketButton = session.mode === 'OFFLINE' &&
                                session.bookingStatus === 'CONFIRMED' &&
                                status !== 'COMPLETED';

                            return (
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
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="bg-[#F5F6FA] text-gray-600 text-xs font-bold px-3 py-1 rounded-full border border-black/5">
                                                {session.mode}
                                            </span>
                                            {status === 'COMPLETED' && !session.hasReviewed && (
                                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full animate-pulse">
                                                    Review Pending
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{session.title}</h3>
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

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2">
                                        {showTicketButton ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowTicket(session); }}
                                                className="flex-1 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                            >
                                                <QrCode size={16} />
                                                View Ticket
                                            </button>
                                        ) : (
                                            <div className="text-sm">
                                                <span className={`font-bold px-3 py-1 rounded-full text-xs ${status === 'COMPLETED' ? 'bg-gray-100 text-gray-500' : status === 'LIVE NOW' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                    {status}
                                                </span>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => setSelectedSession(session)}
                                            className={`${showTicketButton ? 'bg-gray-100 text-gray-900' : 'bg-black text-white'} px-6 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg transition-all transform hover:-translate-y-0.5`}
                                        >
                                            Details
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No bookings yet</h3>
                        <p className="text-gray-500 mb-6">You haven't registered for any sessions yet.</p>
                        <button
                            onClick={() => setActiveTab('Browse Sessions')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                        >
                            Browse Sessions
                        </button>
                    </div>
                )}
            </div>

            {/* Ticket Modal */}
            {showTicket && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowTicket(null)}
                            className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 text-center bg-gradient-to-b from-indigo-50 to-white">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{showTicket.title}</h3>
                            <p className="text-sm text-gray-500 mb-6">{new Date(showTicket.scheduledAt).toLocaleString()}</p>

                            <div className="bg-white p-2 rounded-2xl shadow-sm inline-block">
                                <QRCodeGenerator
                                    bookingId={showTicket.bookingId}
                                    sessionId={showTicket.id}
                                />
                            </div>
                        </div>
                        <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                            <p className="text-xs text-gray-400">
                                This is your entry ticket. Please present this QR code at the venue.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
