import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader2 } from 'lucide-react';
import { apiCall } from '../../utils/api';
import NotificationItem from './NotificationItem';

const POLL_INTERVAL_MS = 45_000;

export default function NotificationBell() {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState({});

    const updateDropdownPosition = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownStyle({
                top: rect.bottom + 12,
                right: window.innerWidth - rect.right,
            });
        }
    }, []);

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
        const onScroll = () => {
            if (open) updateDropdownPosition();
        };
        document.addEventListener('mousedown', onClickOutside);
        document.addEventListener('keydown', onEscape);
        document.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        return () => {
            document.removeEventListener('mousedown', onClickOutside);
            document.removeEventListener('keydown', onEscape);
            document.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
        };
    }, [open, updateDropdownPosition]);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const { notifications: list, unreadCount: count } = await apiCall('/notifications?limit=15');
            setNotifications(list);
            setUnreadCount(count);
        } catch {
            // Leave whatever was previously loaded in place.
        } finally {
            setLoading(false);
        }
    }, []);

    const handleToggle = () => {
        const next = !open;
        setOpen(next);
        if (next) {
            updateDropdownPosition();
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
            if (notification.link.startsWith('http://') || notification.link.startsWith('https://')) {
                window.open(notification.link, '_blank', 'noopener,noreferrer');
            } else {
                navigate(notification.link);
            }
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
                ref={buttonRef}
                onClick={handleToggle}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                aria-expanded={open}
                className="relative p-2 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm rounded-full transition-all duration-300 group"
            >
                <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white" strokeWidth={1.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-orange-500 text-white text-[10px] font-bold rounded-full ring-2 ring-[#F5F6FA] dark:ring-gray-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && createPortal(
                <div
                    style={{ position: 'fixed', top: dropdownStyle.top, right: dropdownStyle.right }}
                    className="w-96 max-w-[90vw] bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[9999]"
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={markingAll}
                                className="text-xs font-semibold text-[#5a59b5] dark:text-[#9190f8] hover:underline disabled:opacity-50"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-5 h-5 text-gray-300 dark:text-gray-600 animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                                    <Bell className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                                </div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">You're all caught up</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">New notifications will show up here.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                                {notifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onClick={() => handleNotificationClick(notification)}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
