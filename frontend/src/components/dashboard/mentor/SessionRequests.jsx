import React from 'react';

export default function SessionRequests({ requests }) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Session Request Status</h3>
                <button className="text-sm text-[#5a59b5] bg-[#C9C7F5]/20 px-4 py-2 rounded-lg hover:bg-[#C9C7F5]/40 transition-colors font-medium">
                    View All
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                            No pending requests.
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-1">{request.title}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(request.requestedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${request.status === 'PENDING'
                                    ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                                    : request.status === 'APPROVED'
                                        ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
                                        : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                                    }`}>
                                    {request.status}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
