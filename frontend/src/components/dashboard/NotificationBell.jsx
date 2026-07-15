import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
    Bell,
    CalendarCheck,
    Clock,
    PlayCircle,
    Radio,
    CheckCircle2,
    XCircle,
    Star,
    Trophy,
    Wallet,
    Ticket,
    FileQuestion,
    Code2,
    FileText,
    Loader2,
} from 'lucide-react';
import { apiCall } from '../../utils/api';

const TYPE_ICON = {
    BOOKING_CONFIRMED: CalendarCheck,
    SESSION_REMINDER: Clock,
    SESSION_STARTING: PlayCircle,
    SESSION_LIVE: Radio,
    SESSION_COMPLETED: CheckCircle2,
    SESSION_CANCELLED: XCircle,
    NEW_REVIEW: Star,
    ACHIEVEMENT_UNLOCKED: Trophy,
    PAYMENT_SUCCESS: Wallet,
    SEAT_AVAILABLE: Ticket,
    QUIZ_LAUNCHED: FileQuestion,
    CODING_QUESTION_LAUNCHED: Code2,
    RESOURCE_UPLOADED: FileText,
    SESSION_REQUEST_APPROVED: CheckCircle2,
    SESSION_REQUEST_REJECTED: XCircle,
};

const POLL_INTERVAL_MS = 45_000;

export default function NotificationBell() {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const { unreadCount: count } = await apiCall('/notifications/unread-count');
            setUnreadCount(count);
        } catch {
            // Silent — the bell just won't show a fresh count this cycle.
        }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    useEffect(() => {
        const onClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const onEscape = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onEscape);
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onEscape);
        };
    }, []);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const { notifications: list, unreadCount: count } = await apiCall('/notifications?limit=15');
            setNotifications(list);
            setUnreadCount(count);
            setLoaded(true);
        } catch {
            // Leave whatever was previously loaded in place.
        } finally {
            setLoading(false);
        }
    }, []);

    const handleToggle = () => {
        const next = !open;
        setOpen(next);
        if (next && !loaded) {
            fetchNotifications();
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            apiCall(`/notifications/${notification.id}/read`, 'PUT').catch(() => {});
        }
        setOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0 || markingAll) return;
        setMarkingAll(true);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            await apiCall('/notifications/read-all', 'PUT');
        } catch {
            // Worst case the badge undercounts until the next poll — acceptable.
        } finally {
            setMarkingAll(false);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={handleToggle}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                aria-expanded={open}
                className="relative p-2 hover:bg-white hover:shadow-sm rounded-full transition-all duration-300 group"
            >
                <Bell className="w-6 h-6 text-gray-600 group-hover:text-gray-900" strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full ring-2 ring-[#F5F6FA]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-3 w-96 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-800">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={markingAll}
                                className="text-xs font-semibold text-[#5a59b5] hover:underline disabled:opacity-50"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                    <Bell className="w-5 h-5 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">You're all caught up</p>
                                <p className="text-xs text-gray-400 mt-1">New notifications will show up here.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {notifications.map((notification) => {
                                    const Icon = TYPE_ICON[notification.type] || Bell;
                                    return (
                                        <li key={notification.id}>
                                            <button
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`w-full text-left flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors ${
                                                    !notification.isRead ? 'bg-[#5a59b5]/[0.04]' : ''
                                                }`}
                                            >
                                                <div className="w-9 h-9 rounded-xl bg-[#C9C7F5]/20 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Icon className="w-4 h-4 text-[#5a59b5]" aria-hidden="true" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 mt-1">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-2" aria-hidden="true" />
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
