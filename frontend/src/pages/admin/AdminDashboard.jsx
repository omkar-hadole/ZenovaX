import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { Users, BookOpen, Clock, AlertCircle, Calendar, User } from 'lucide-react';
import InlineError from '../../components/InlineError';
import { AdminDashboardSkeleton } from '../../components/common/AdminSkeletons';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalLearners: 0,
        totalMentors: 0,
        pendingApprovals: 0,
        recentSessions: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiCall('/admin/stats');
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch admin stats", error);
            setError(error.message || "Failed to fetch admin stats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) return <AdminDashboardSkeleton />;

    if (error) {
        return (
            <div className="p-4 sm:p-8">
                <InlineError message={error} onRetry={fetchStats} />
            </div>
        );
    }

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
                <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium truncate">{title}</p>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</h3>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-8 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Total Sessions"
                    value={stats.totalSessions}
                    icon={BookOpen}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Total Learners"
                    value={stats.totalLearners}
                    icon={Users}
                    color="bg-green-500"
                />
                <StatCard
                    title="Total Mentors"
                    value={stats.totalMentors}
                    icon={Users}
                    color="bg-purple-500"
                />
                <StatCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals}
                    icon={Clock}
                    color="bg-orange-500"
                />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Recently Added Sessions</h2>
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Title</th>
                                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Mentor</th>
                                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Date</th>
                                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {stats.recentSessions.map((session) => (
                                <tr key={session.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                                    <td className="py-4 text-sm font-medium text-gray-900 dark:text-gray-100">{session.title}</td>
                                    <td className="py-4 text-sm text-gray-500 dark:text-gray-400">{session.mentor?.name}</td>
                                    <td className="py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(session.scheduledAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${session.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                                session.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {stats.recentSessions.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-500 dark:text-gray-400">
                                        No recent sessions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-800">
                    {stats.recentSessions.map((session) => (
                        <div key={session.id} className="py-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.title}</p>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${session.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                        session.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    }`}>
                                    {session.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {session.mentor?.name}</span>
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(session.scheduledAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {stats.recentSessions.length === 0 && (
                        <div className="py-8 text-center text-gray-500 dark:text-gray-400">No recent sessions found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
