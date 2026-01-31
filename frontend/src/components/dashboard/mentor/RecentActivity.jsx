import React, { useState, useEffect } from 'react';
import { apiCall } from '../../../utils/api';
import { Clock, Bell } from 'lucide-react';

export default function RecentActivity() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const data = await apiCall('/sessions/activity');
                if (data.activities && data.activities.length > 0) {
                    setActivities(data.activities);
                } else {
                    // Fallback to empty state or mocked welcome message
                    setActivities([{
                        action: 'Welcome!',
                        detail: 'Your recent dashboard activity will appear here.',
                        time: 'Just now'
                    }]);
                }
            } catch (error) {
                console.error("Failed to fetch activity", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, []);

    const formatTime = (dateString) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>

            <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 space-y-6">
                {activities.length > 0 ? (
                    activities.map((activity, i) => (
                        <div key={i} className="flex gap-4 group">
                            <div className="relative mt-1">
                                <div className={`w-3 h-3 rounded-full ring-4 ring-white group-hover:scale-110 transition-transform duration-300 ${activity.isNegative ? 'bg-red-400' : 'bg-[#C9C7F5]'}`} />
                                {i !== activities.length - 1 && (
                                    <div className="absolute top-3 left-1.5 w-0.5 h-full bg-gray-100 -ml-px group-hover:bg-[#C9C7F5]/30 transition-colors" />
                                )}
                            </div>
                            <div className="flex-1 pb-2">
                                <p className={`text-sm font-bold ${activity.isNegative ? 'text-red-500' : 'text-gray-800'}`}>{activity.action}</p>
                                <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{activity.detail}</p>
                                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400 font-medium">
                                    <Clock size={12} />
                                    <span>{activity.createdAt ? formatTime(activity.createdAt) : activity.time}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No recent activity</p>
                    </div>
                )}
            </div>
        </section>
    );
}
