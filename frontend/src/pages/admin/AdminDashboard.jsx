import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { Users, BookOpen, Clock, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalLearners: 0,
        totalMentors: 0,
        pendingApprovals: 0,
        recentSessions: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiCall('/admin/stats');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch admin stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8">Loading stats...</div>;

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            </div>
        </div>
    );

    return (
        <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Recently Added Sessions</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="pb-3 text-sm font-medium text-gray-500">Title</th>
                                <th className="pb-3 text-sm font-medium text-gray-500">Mentor</th>
                                <th className="pb-3 text-sm font-medium text-gray-500">Date</th>
                                <th className="pb-3 text-sm font-medium text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {stats.recentSessions.map((session) => (
                                <tr key={session.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-4 text-sm font-medium text-gray-900">{session.title}</td>
                                    <td className="py-4 text-sm text-gray-500">{session.mentor?.name}</td>
                                    <td className="py-4 text-sm text-gray-500">
                                        {new Date(session.scheduledAt).toLocaleDateString()}
                                    </td>
                                    <td className="py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${session.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                                                session.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {stats.recentSessions.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="py-8 text-center text-gray-500">
                                        No recent sessions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
