import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { Check, X, Clock } from 'lucide-react';

export default function PendingSessions() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await apiCall('/admin/pending-sessions');
            setRequests(data);
        } catch (error) {
            console.error("Failed to fetch pending sessions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (requestId) => {
        if (!window.confirm("Are you sure you want to approve this session?")) return;
        try {
            await apiCall('/admin/approve-session', 'POST', { requestId });
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error("Failed to approve session", error);
            alert("Failed to approve session");
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm("Are you sure you want to reject this session?")) return;
        try {
            await apiCall('/admin/reject-session', 'POST', { requestId });
            fetchRequests(); // Refresh list
        } catch (error) {
            console.error("Failed to reject session", error);
            alert("Failed to reject session");
        }
    };

    if (loading) return <div className="p-8">Loading requests...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Session Approvals</h1>

            <div className="grid gap-6">
                {requests.map((request) => (
                    <div key={request.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Pending
                                </span>
                                <span className="text-sm text-gray-500">
                                    Requested on {new Date(request.requestedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{request.title}</h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{request.description}</p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-900">Mentor:</span> {request.mentor?.name}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-900">Date:</span> {new Date(request.proposedDate).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-900">Seats:</span> {request.maxSeats}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="font-medium text-gray-900">Price:</span> {request.price > 0 ? `₹${request.price}` : 'Free'}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 md:border-l md:pl-6 border-gray-100">
                            <button
                                onClick={() => handleApprove(request.id)}
                                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition-colors"
                            >
                                <Check className="w-4 h-4" /> Approve
                            </button>
                            <button
                                onClick={() => handleReject(request.id)}
                                className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                            >
                                <X className="w-4 h-4" /> Reject
                            </button>
                        </div>
                    </div>
                ))}

                {requests.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No pending session requests.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
