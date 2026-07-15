import React from 'react';
import { BookOpen, Calendar, Clock } from 'lucide-react';

export default function RecentCourses({ courses = [], onViewAll, onCourseClick, title = "Recent Courses" }) {
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {courses.length > 0 ? (
                    courses.map((course, idx) => {
                        const colors = ['bg-[#C9C7F5]', 'bg-[#F6D483]', 'bg-[#A9C1F7]'];
                        const accentColor = colors[idx % colors.length];

                        return (
                            <div
                                key={course.id}
                                onClick={() => onCourseClick && onCourseClick(course)}
                                className="bg-white dark:bg-gray-900 rounded-[2rem] p-5 shadow-sm border border-black/5 dark:border-white/5 flex flex-col h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-gray-50 dark:from-gray-800 to-transparent rounded-bl-[4rem] -mr-4 -mt-4 opacity-50" />

                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                            <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{course.subject || 'Design'}</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-black/5 dark:border-white/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>

                                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{course.title}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-medium">By {course.mentor?.name}</p>

                                <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between relative z-10">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Scheduled For</span>
                                        <div className={`text-xs px-3 py-1 rounded-full font-bold text-black ${accentColor} flex items-center gap-1`}>
                                            <Calendar className="w-3 h-3" />
                                            {course.scheduledAt ? new Date(course.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBA'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">
                                        <Clock className="w-3 h-3" />
                                        <span>{course.duration || 60} min</span>
                                    </div>
                                </div>
                                <div className={`absolute bottom-0 left-0 w-full h-1.5 ${accentColor.replace('bg-', 'bg-opacity-50 ')}`} />
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-3 text-center py-10 bg-white dark:bg-gray-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No recent courses</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start learning today!</p>
                    </div>
                )}
            </div>
        </section>
    );
}
