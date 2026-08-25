import React, { useState } from 'react';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { YEARS, getCoursesForYear, getCourseById } from '../../../data/courseOutlines';

// Per-year accent themes matching the mentor dashboard palette
// (purple / blue / gold / violet)
const YEAR_THEMES = {
    1: { iconBg: 'bg-[#C9C7F5]/25', iconText: 'text-[#5a59b5]', chip: 'bg-[#C9C7F5]/20 text-[#5a59b5]', hoverBorder: 'hover:border-[#b8b6e5]' },
    2: { iconBg: 'bg-[#A9C1F7]/25', iconText: 'text-[#4a7ac7]', chip: 'bg-[#A9C1F7]/20 text-[#4a7ac7]', hoverBorder: 'hover:border-[#98b0e5]' },
    3: { iconBg: 'bg-[#F7D483]/30', iconText: 'text-[#b59a5a]', chip: 'bg-[#F7D483]/25 text-[#b59a5a]', hoverBorder: 'hover:border-[#e5c372]' },
    4: { iconBg: 'bg-[#7A79E6]/15', iconText: 'text-[#6a69d0]', chip: 'bg-[#7A79E6]/10 text-[#6a69d0]', hoverBorder: 'hover:border-[#a5a4ef]' },
};

export default function CourseOutline() {
    const [yearId, setYearId] = useState(null);
    const [courseId, setCourseId] = useState(null);

    const theme = YEAR_THEMES[yearId];
    const yearLabel = YEARS.find(y => y.id === yearId)?.label;
    const courses = yearId ? getCoursesForYear(yearId) : [];
    const course = yearId && courseId ? getCourseById(yearId, courseId) : null;

    const pickYear = (id) => { setYearId(id); setCourseId(null); };
    const resetAll = () => { setYearId(null); setCourseId(null); };

    return (
        <section>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-light text-gray-800 dark:text-gray-100 tracking-tight">
                    {course ? course.name : yearId ? `${yearLabel} Courses` : 'Course Outline'}
                </h3>
                {(yearId || courseId) && (
                    <button
                        onClick={resetAll}
                        className="text-xs font-bold text-white bg-[#A9C1F7] px-4 py-2 rounded-full hover:bg-[#8FB0F5] transition-all shadow-sm hover:shadow-md"
                    >
                        All Years
                    </button>
                )}
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 co-scroll">

                {/* Step 1 — Select Year */}
                {!yearId && YEARS.map((year) => {
                    const t = YEAR_THEMES[year.id];
                    return (
                        <div
                            key={year.id}
                            onClick={() => pickYear(year.id)}
                            className={`bg-white dark:bg-gray-900 rounded-[1.5rem] px-4 py-3.5 flex items-center gap-4 shadow-sm border border-black/5 dark:border-white/5 hover:shadow-lg transition-all duration-300 group cursor-pointer ${t.hoverBorder}`}
                        >
                            <div className={`w-11 h-11 shrink-0 ${t.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                <GraduationCap className={`w-5 h-5 ${t.iconText}`} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-blue-600 transition-colors truncate">{year.label}</h4>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate mt-0.5">
                                    {getCoursesForYear(year.id).length} courses
                                </p>
                            </div>
                            <span className={`${t.chip} px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0`}>
                                Open
                            </span>
                        </div>
                    );
                })}

                {/* Step 2 — Select Course */}
                {yearId && !course && courses.map((c) => (
                    <div
                        key={c.id}
                        onClick={() => setCourseId(c.id)}
                        className={`bg-white dark:bg-gray-900 rounded-[1.5rem] px-4 py-3.5 flex items-center gap-4 shadow-sm border border-black/5 dark:border-white/5 hover:shadow-lg transition-all duration-300 group cursor-pointer ${theme.hoverBorder}`}
                    >
                        <div className={`w-11 h-11 shrink-0 ${theme.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <BookOpen className={`w-5 h-5 ${theme.iconText}`} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{c.name}</h4>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate mt-0.5">
                                {c.units.length} units · {c.units.reduce((n, u) => n + u.topics.length, 0)} topics
                            </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    </div>
                ))}

                {/* Step 3 — View Course Outline */}
                {course && course.units.map((unit) => (
                    <div
                        key={unit.number}
                        className={`bg-white dark:bg-gray-900 rounded-[1.5rem] px-4 py-3.5 flex items-start gap-4 shadow-sm border border-black/5 dark:border-white/5 hover:shadow-lg transition-all duration-300 ${theme.hoverBorder}`}
                    >
                        <div className={`w-11 h-11 shrink-0 ${theme.iconBg} rounded-xl flex items-center justify-center`}>
                            <span className={`text-sm font-black ${theme.iconText}`}>{unit.number}</span>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">Unit {unit.number} — {unit.title}</h4>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed mt-1">
                                {unit.topics.join(' · ')}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
                .co-scroll::-webkit-scrollbar { width: 4px; }
                .co-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
                .dark .co-scroll::-webkit-scrollbar-thumb { background: #3f3f46; }
            `}</style>
        </section>
    );
}
