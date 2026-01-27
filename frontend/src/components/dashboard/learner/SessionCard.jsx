import React from 'react';
import { Calendar, Clock } from 'lucide-react';

export default function SessionCard({ session, footer, extraBadges, onClick }) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group flex flex-col h-full"
        >
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
                    {extraBadges}
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{session.title}</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">{session.description || 'Join this session to learn more.'}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4 bg-[#F5F6FA] p-3 rounded-xl">
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

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto gap-2">
                {footer}
            </div>
        </div>
    );
}
