import React, { useState, useRef } from 'react';
import { Calendar, Clock, Settings, QrCode, X, Download } from 'lucide-react';
import SessionSkeleton from '../SessionSkeleton';
import SessionCard from './SessionCard';
import QRCodeGenerator from '../../common/QRCodeGenerator';
import domtoimage from 'dom-to-image-more';

export default function MyBookingsView({
    myBookings,
    isLoading,
    setSelectedSession,
    setActiveTab
}) {
    const [showTicket, setShowTicket] = useState(null);
    const ticketRef = useRef(null);

    const handleDownloadTicket = async () => {
        if (!ticketRef.current) return;

        try {
            const dataUrl = await domtoimage.toPng(ticketRef.current, {
                quality: 1,
                style: {
                    transform: 'scale(2)',
                    transformOrigin: 'top left',
                    width: ticketRef.current.offsetWidth + 'px',
                    height: ticketRef.current.offsetHeight + 'px',
                    'border-style': 'none' // Force remove border at root
                },
                filter: (node) => {
                    // Ensure no borders on any element
                    if (node.style) {
                        node.style.border = 'none';
                        node.style.boxShadow = 'none';
                    }
                    return true;
                },
                width: ticketRef.current.offsetWidth * 2,
                height: ticketRef.current.offsetHeight * 2
            });

            // Security: This anchor element is created programmatically for file download only.
            // 'dataUrl' is a PNG data URL produced by dom-to-image-more from a local DOM node,
            // not from user input, so there is no XSS risk here.
            const link = document.createElement('a');
            link.download = `ZenovaX-Ticket-${showTicket.title.replace(/\s+/g, '-')}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Failed to download ticket", error);
            alert("Could not download ticket. Please try again.");
        }
    };

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
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    extraBadges={
                                        status === 'COMPLETED' && !session.hasReviewed && (
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full animate-pulse">
                                                Review Pending
                                            </span>
                                        )
                                    }
                                    footer={
                                        <>
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
                                        </>
                                    }
                                />
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
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">

                        {/* Download Button (Top Left) */}
                        <button
                            onClick={handleDownloadTicket}
                            className="absolute top-4 left-4 z-20 p-2 bg-black/10 hover:bg-black/20 text-gray-800 rounded-full transition-colors backdrop-blur-md"
                            title="Download Ticket"
                        >
                            <Download size={20} />
                        </button>

                        {/* Close Button (Top Right) */}
                        <button
                            onClick={() => setShowTicket(null)}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 text-gray-800 rounded-full transition-colors backdrop-blur-md"
                        >
                            <X size={20} />
                        </button>

                        {/* Capture Area */}
                        <div ref={ticketRef} className="bg-white">
                            {/* Explicit inline style for gradient to avoid html2canvas oklch error */}
                            <div
                                className="p-8 text-center pt-16"
                                style={{ background: 'linear-gradient(to bottom, #eef2ff, #ffffff)' }}
                            >
                                <h3 className="text-xl font-bold text-gray-900 mb-1">{showTicket.title}</h3>
                                <p className="text-sm text-gray-500 mb-6">{new Date(showTicket.scheduledAt).toLocaleString()}</p>

                                <div className="bg-white p-2 rounded-2xl shadow-sm inline-block border border-gray-100">
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
                </div>
            )}
        </div>
    );
}
