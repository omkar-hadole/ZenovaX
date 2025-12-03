import React from 'react';

export default function SessionRequests({ requests }) {
    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Session Request Status</h3>
                <button className="text-sm text-[#5a59b5] bg-[#C9C7F5]/20 px-4 py-2 rounded-lg hover:bg-[#C9C7F5]/40 transition-colors font-medium">
                    View All
                </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="space-y-4">
                    {requests.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                            No pending requests.
                        </div>
                    ) : (
                        requests.map((request) => (
                            <div key={request.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-800 text-sm mb-1">{request.title}</h4>
                                    <p className="text-xs text-gray-500">
                                        {new Date(request.requestedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${request.status === 'PENDING'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : request.status === 'APPROVED'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
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
