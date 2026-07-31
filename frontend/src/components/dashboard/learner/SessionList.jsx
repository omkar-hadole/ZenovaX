import React from 'react';
import { BookOpen } from 'lucide-react';

export default function SessionList({ title, sessions, type = 'course', onViewAll, onSessionClick }) {
    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-light text-gray-800 dark:text-gray-100 tracking-tight">{title}</h3>
                <button
                    onClick={onViewAll}
                    className="text-xs font-bold text-white bg-[#A9C1F7] px-4 py-2 rounded-full hover:bg-[#8FB0F5] transition-all shadow-sm hover:shadow-md"
                >
                    View All
                </button>
            </div>

            <div className="space-y-4">
                {sessions.length > 0 ? (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => onSessionClick && onSessionClick(session.id)}
                            className="bg-white dark:bg-gray-900 rounded-[1.5rem] p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 shadow-sm border border-black/5 dark:border-white/5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 group cursor-pointer"
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={`w-14 h-14 shrink-0 ${session.color.replace('bg-blue-100', 'bg-[#C9C7F5]/20').replace('bg-yellow-100', 'bg-[#F6D483]/20').replace('bg-orange-100', 'bg-[#F6D483]/20')} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <BookOpen className={`w-6 h-6 ${session.color.includes('blue') ? 'text-[#5B8DEF]' : 'text-[#D4A017]'}`} strokeWidth={1.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1 group-hover:text-blue-600 transition-colors truncate">{session.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                                        {type === 'course' ? `By ${session.mentor}` : session.instructor}
                                    </p>
                                </div>
                            </div>
                            {type === 'course' ? (
                                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 shrink-0">
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Duration</p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{session.date}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSessionClick && onSessionClick(session.id);
                                        }}
                                        className="bg-[#5B8DEF] text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#4A7AC7] transition-all shadow-sm hover:shadow-md"
                                    >
                                        View Session
                                    </button>
                                </div>
                            ) : (
                                <button className="bg-[#F6D483] text-black px-5 py-2 rounded-xl text-xs font-bold hover:bg-[#FFE5A5] transition-all shadow-sm hover:shadow-md shrink-0">
                                    {session.status}
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No {title.toLowerCase()} found</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Check back later!</p>
                    </div>
                )}
            </div>
        </section>
    );
}
