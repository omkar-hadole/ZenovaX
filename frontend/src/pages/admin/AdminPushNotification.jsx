import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../../utils/api';
import {
    Send,
    Users,
    UserCheck,
    GraduationCap,
    BookOpen,
    User as UserIcon,
    Loader2,
    History,
    ChevronDown,
    Search,
    Megaphone,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import InlineError from '../../components/InlineError';

const AUDIENCE_OPTIONS = [
    { value: 'ALL', label: 'Everyone', icon: Users, desc: 'All users on the platform' },
    { value: 'LEARNERS', label: 'All Learners', icon: GraduationCap, desc: 'All users with Learner role' },
    { value: 'MENTORS', label: 'All Mentors', icon: UserCheck, desc: 'All users with Mentor role' },
    { value: 'COURSE_ENROLLED', label: 'Course Enrolled', icon: BookOpen, desc: 'Learners enrolled in a specific course' },
    { value: 'SINGLE_USER', label: 'Specific User', icon: UserIcon, desc: 'Send to a single user' },
];

export default function AdminPushNotification() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('');
    const [audienceType, setAudienceType] = useState('ALL');
    const [audienceId, setAudienceId] = useState('');

    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userSearchOpen, setUserSearchOpen] = useState(false);

    const [sending, setSending] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const [tab, setTab] = useState('send');
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);

    const fetchSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            const data = await apiCall('/admin/notifications/sessions?limit=200');
            setSessions(data.sessions || []);
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        } finally {
            setSessionsLoading(false);
        }
    }, []);

    const fetchHistory = useCallback(async (page = 1) => {
        setHistoryLoading(true);
        try {
            const data = await apiCall(`/admin/notifications/history?page=${page}&limit=20`);
            setHistory(data.logs || []);
            setHistoryPage(data.pagination?.page || 1);
            setHistoryTotalPages(data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        if (audienceType === 'COURSE_ENROLLED') {
            fetchSessions();
        }
    }, [audienceType, fetchSessions]);

    useEffect(() => {
        if (tab === 'history') {
            fetchHistory();
        }
    }, [tab, fetchHistory]);

    useEffect(() => {
        if (!userSearch.trim() || audienceType !== 'SINGLE_USER') {
            setUserResults([]);
            return;
        }
        const timeout = setTimeout(async () => {
            try {
                const data = await apiCall(`/admin/notifications/users/search?search=${encodeURIComponent(userSearch)}&limit=10`);
                setUserResults(data.users || []);
            } catch {
                setUserResults([]);
            }
        }, 300);
        return () => clearTimeout(timeout);
    }, [userSearch, audienceType]);

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) return;
        setSending(true);
        setError(null);
        setResult(null);
        try {
            const payload = {
                title: title.trim(),
                message: message.trim(),
                link: link.trim() || undefined,
                audienceType,
                audienceId: audienceId || undefined,
            };
            if (audienceType === 'SINGLE_USER' && selectedUser) {
                payload.audienceId = selectedUser.id;
            }
            const data = await apiCall('/admin/notifications/push', 'POST', payload);
            setResult(data);
            setTitle('');
            setMessage('');
            setLink('');
            setSelectedUser(null);
            setUserSearch('');
        } catch (err) {
            setError(err.message || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    const getUserDisplay = () => {
        if (!selectedUser) return null;
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{selectedUser.name}</span>
                <span className="text-xs text-gray-400">({selectedUser.email})</span>
                <button
                    onClick={() => { setSelectedUser(null); setUserSearch(''); }}
                    className="text-gray-400 hover:text-red-500 ml-1"
                >
                    &times;
                </button>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <Megaphone className="w-7 h-7 text-[#5a59b5]" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Push Notification</h1>
            </div>

            <div className="flex gap-1 bg-white dark:bg-gray-900 rounded-xl p-1 border border-gray-100 dark:border-gray-800 w-fit">
                <button
                    onClick={() => setTab('send')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'send' ? 'bg-[#5a59b5] text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                    <Send className="w-4 h-4" /> Send
                </button>
                <button
                    onClick={() => setTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'history' ? 'bg-[#5a59b5] text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                    <History className="w-4 h-4" /> History
                </button>
            </div>

            {tab === 'send' ? (
                <>
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Compose Notification</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Important Announcement"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a59b5]/30 dark:text-gray-100"
                                maxLength={200}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message *</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Write your notification message..."
                                rows={4}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a59b5]/30 dark:text-gray-100 resize-none"
                                maxLength={1000}
                            />
                            <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/1000</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Link (optional)</label>
                            <input
                                type="text"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="e.g. /sessions/abc123"
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a59b5]/30 dark:text-gray-100"
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Target Audience</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {AUDIENCE_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = audienceType === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            setAudienceType(opt.value);
                                            setAudienceId('');
                                            setSelectedUser(null);
                                            setUserSearch('');
                                        }}
                                        className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                            ? 'border-[#5a59b5] bg-[#5a59b5]/5 dark:bg-[#9190f8]/10'
                                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#5a59b5] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{opt.label}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {audienceType === 'COURSE_ENROLLED' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Course *</label>
                                {sessionsLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading sessions...
                                    </div>
                                ) : (
                                    <select
                                        value={audienceId}
                                        onChange={(e) => setAudienceId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a59b5]/30 dark:text-gray-100"
                                    >
                                        <option value="">Choose a course...</option>
                                        {sessions.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.title} {s.mentor?.name ? `- ${s.mentor.name}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {audienceType === 'SINGLE_USER' && (
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Search User *</label>
                                {selectedUser ? (
                                    getUserDisplay()
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            onFocus={() => setUserSearchOpen(true)}
                                            placeholder="Search by name or email..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#5a59b5]/30 dark:text-gray-100"
                                        />
                                        {userSearchOpen && userResults.length > 0 && (
                                            <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                                                {userResults.map((u) => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => {
                                                            setSelectedUser(u);
                                                            setUserSearchOpen(false);
                                                            setUserSearch('');
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                                            {u.name?.[0] || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.name}</p>
                                                            <p className="text-xs text-gray-400">{u.email} — {u.role}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 space-y-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Preview</h2>
                        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <div className="w-10 h-10 rounded-xl bg-[#C9C7F5]/20 dark:bg-[#9190f8]/15 flex items-center justify-center shrink-0">
                                <Megaphone className="w-5 h-5 text-[#5a59b5] dark:text-[#9190f8]" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title || 'Notification Title'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{message || 'Your message will appear here...'}</p>
                                {link && <p className="text-xs text-[#5a59b5] mt-1">Link: {link}</p>}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                        </div>
                    )}

                    {result && (
                        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-sm text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            Notification sent to {result.totalSent} user{result.totalSent !== 1 ? 's' : ''}!
                        </div>
                    )}

                    <button
                        onClick={handleSend}
                        disabled={sending || !title.trim() || !message.trim() || (audienceType === 'COURSE_ENROLLED' && !audienceId) || (audienceType === 'SINGLE_USER' && !selectedUser)}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-[#5a59b5] hover:bg-[#4a49a0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
                    >
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {sending ? 'Sending...' : 'Send Notification'}
                    </button>
                </>
            ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Notification History</h2>
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No notifications sent yet</p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-800">
                                            <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Title</th>
                                            <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Audience</th>
                                            <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Sent</th>
                                            <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {history.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                                                <td className="py-3.5">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.title}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{log.message}</p>
                                                </td>
                                                <td className="py-3.5">
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                        {log.audienceType.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 text-sm text-gray-600 dark:text-gray-400">{log.totalSent}</td>
                                                <td className="py-3.5 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(log.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                                {history.map((log) => (
                                    <div key={log.id} className="py-3.5">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{log.title}</p>
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                                                {log.audienceType.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{log.message}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {log.totalSent} sent · {new Date(log.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                            {historyTotalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4">
                                    <button
                                        onClick={() => fetchHistory(historyPage - 1)}
                                        disabled={historyPage <= 1}
                                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                                    >
                                        Prev
                                    </button>
                                    <span className="text-sm text-gray-500">
                                        {historyPage} / {historyTotalPages}
                                    </span>
                                    <button
                                        onClick={() => fetchHistory(historyPage + 1)}
                                        disabled={historyPage >= historyTotalPages}
                                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
