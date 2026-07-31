import React, { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Video, MapPin, Calendar } from 'lucide-react';

export default function DailySchedule({ bookings = [] }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [hoveredDate, setHoveredDate] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    // Touch devices have no hover, so taps must pin the tooltip instead.
    const isTouch = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    const getBookingsForDate = (date) => {
        return bookings.filter(booking =>
            isSameDay(parseISO(booking.scheduledAt), date)
        ).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    };

    return (
        <section className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 overflow-visible relative z-10 hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-base font-light text-gray-800 dark:text-gray-100 tracking-tight">
                        Daily Schedule
                    </h3>
                    <div className="p-1.5 bg-[#F5F6FA] dark:bg-gray-800/60 rounded-full">
                        <Calendar className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={prevMonth} className="p-1 hover:bg-[#F5F6FA] dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                        <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[60px] text-center">{format(currentDate, 'MMMM')}</span>
                    <button onClick={nextMonth} className="p-1 hover:bg-[#F5F6FA] dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="px-5 pb-4">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                        <div key={index} className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 place-items-center">
                    {calendarDays.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isDayToday = isToday(day);
                        const dayBookings = getBookingsForDate(day);
                        const hasEvent = dayBookings.length > 0;

                        return (
                            <div
                                key={idx}
                                className="relative group w-8 h-8 flex items-center justify-center"
                                onMouseEnter={() => setHoveredDate(day)}
                                onMouseLeave={() => setHoveredDate(null)}
                            >
                                <button
                                    onClick={() => isTouch && hasEvent && setSelectedDate(selectedDate === day ? null : day)}
                                    className={`
                                        w-8 h-8 flex flex-col items-center justify-center rounded-full text-[10px] font-medium transition-all duration-300 relative
                                        ${!isCurrentMonth ? 'text-gray-200 dark:text-gray-700' : 'text-gray-600 dark:text-gray-400'}
                                        ${isDayToday ? 'bg-[#5B8DEF] text-white shadow-md shadow-blue-200 dark:shadow-blue-950/50 scale-105' : 'hover:bg-[#F5F6FA] dark:hover:bg-gray-800'}
                                        ${hasEvent && !isDayToday ? 'bg-[#F6D483]/20 text-gray-900 dark:text-gray-100 font-bold' : ''}
                                    `}
                                >
                                    <span>{format(day, 'd')}</span>
                                    {hasEvent && !isDayToday && (
                                        <span className="w-1 h-1 rounded-full mt-0.5 bg-[#F6D483]" />
                                    )}
                                </button>

                                {hasEvent && (
                                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-black/5 dark:border-white/5 p-3 z-50 pointer-events-none transform transition-all duration-300 ${isTouch
                                        ? selectedDate === day
                                            ? 'opacity-100 visible translate-y-0'
                                            : 'opacity-0 invisible translate-y-2'
                                        : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0'
                                        }`}>
                                        <div className="text-[10px] font-bold text-gray-900 dark:text-gray-100 mb-2 pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                            <span>{format(day, 'MMMM d')}</span>
                                            <span className="bg-[#F5F6FA] dark:bg-gray-800/60 px-1.5 py-0.5 rounded-full text-[9px] text-gray-500 dark:text-gray-400">{dayBookings.length} classes</span>
                                        </div>
                                        <div className="space-y-2">
                                            {dayBookings.map(session => (
                                                <div key={session.id} className="flex flex-col gap-0.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-bold text-[#5B8DEF] bg-[#5B8DEF]/10 px-1.5 py-0.5 rounded-md">
                                                            {format(parseISO(session.scheduledAt), 'h:mm a')}
                                                        </span>
                                                        <span className={`text-[7px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 uppercase tracking-wider
                                                            ${session.mode === 'ONLINE' ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400'}
                                                        `}>
                                                            {session.mode === 'ONLINE' ? <Video className="w-2 h-2" /> : <MapPin className="w-2 h-2" />}
                                                            {session.mode}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-900 dark:text-gray-100 truncate">{session.title}</p>
                                                    <p className="text-[9px] text-gray-400 dark:text-gray-500 truncate flex items-center gap-1">
                                                        <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                                                        {session.mentor?.name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-white dark:border-t-gray-900 drop-shadow-sm" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
