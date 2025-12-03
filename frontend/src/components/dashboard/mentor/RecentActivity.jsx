import React from 'react';

export default function RecentActivity() {
    return (
        <section>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                {[
                    { action: 'New booking', detail: 'React Patterns session', time: '2h ago' },
                    { action: 'Review received', detail: '5 stars from John Doe', time: '5h ago' },
                    { action: 'Session completed', detail: 'UI/UX Fundamentals', time: '1d ago' }
                ].map((activity, i) => (
                    <div key={i} className="flex gap-3">
                        <div className="w-2 h-2 bg-[#C9C7F5] rounded-full mt-2" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{activity.action}</p>
                            <p className="text-xs text-gray-500">{activity.detail}</p>
                            <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
