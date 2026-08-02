import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import { Check, X, Clock, Pencil } from 'lucide-react';
import ConfirmModal from '../../components/common/ConfirmModal';
import Toast from '../../components/Toast';
import { stripMarkdown } from '../../utils/descriptionFormatter';
import SessionPreviewModal from '../../components/dashboard/mentor/SessionPreviewModal';
import { AdminPendingSkeleton } from '../../components/common/AdminSkeletons';

export default function PendingSessions() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [previewRequest, setPreviewRequest] = useState(null);

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

    const handleApprove = (requestId) => {
        setConfirmModal({
            isOpen: true,
            title: "Approve Session",
            message: "Are you sure you want to approve this session request?",
            confirmText: "Approve",
            type: "info",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await apiCall('/admin/approve-session', 'POST', { requestId });
                    setToast({ message: 'Session approved successfully!', type: 'success' });
                    fetchRequests();
                } catch (error) {
                    console.error("Failed to approve session", error);
                    const errorMsg = error.message || error.error || JSON.stringify(error);
                    setToast({ message: `Failed to approve session: ${errorMsg}`, type: 'error' });
                }
            }
        });
    };

    const handleReject = (requestId) => {
        setConfirmModal({
            isOpen: true,
            title: "Reject Session",
            message: "Are you sure you want to reject this session request?",
            confirmText: "Reject",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await apiCall('/admin/reject-session', 'POST', { requestId });
                    setToast({ message: 'Session rejected successfully!', type: 'success' });
                    fetchRequests();
                } catch (error) {
                    console.error("Failed to reject session", error);
                    const errorMsg = error.message || error.error || JSON.stringify(error);
                    setToast({ message: `Failed to reject session: ${errorMsg}`, type: 'error' });
                }
            }
        });
    };

    if (loading) {
        return <AdminPendingSkeleton />;
    }

    return (
        <div className="p-4 sm:p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pending Approvals</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Review and manage session requests from mentors</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {requests.map((request) => (
                    <div key={request.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all duration-300 flex flex-col h-full group">

                        <div className="flex items-start justify-between mb-4">
                            <span className="bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1 rounded-full border border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 uppercase tracking-wide flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Pending
                            </span>
                            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/60 px-2 py-1 rounded-lg">
                                {new Date(request.requestedAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="mb-6 flex-1">
                            <h3
                                onClick={() => setPreviewRequest(request)}
                                className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                            >
                                {request.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 leading-relaxed">
                                {stripMarkdown(request.description)}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-lg">
                                {request.mentor?.name?.[0] || 'M'}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{request.mentor?.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{request.mentor?.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Date</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                    {new Date(request.proposedDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Duration</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{request.duration} min</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Seats</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{request.maxSeats}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Price</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{request.price > 0 ? `₹${request.price}` : 'Free'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                                onClick={() => navigate(`/mentor/edit-session/${request.id}`)}
                                title="Edit request"
                                aria-label="Edit request"
                                className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex-shrink-0"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleApprove(request.id)}
                                className="flex-1 bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none"
                            >
                                <Check className="w-4 h-4" /> Approve
                            </button>
                            <button
                                onClick={() => handleReject(request.id)}
                                className="flex-1 bg-white dark:bg-gray-900 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-500/20 py-3 rounded-xl text-sm font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 hover:border-red-200 dark:hover:border-red-500/30"
                            >
                                <X className="w-4 h-4" /> Reject
                            </button>
                        </div>
                    </div>
                ))}

                {requests.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-700 text-center">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/60 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">All Caught Up!</h3>
                        <p className="text-gray-500 dark:text-gray-400">No pending session requests at the moment.</p>
                    </div>
                )}
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            {previewRequest && (() => {
                const date = new Date(previewRequest.proposedDate);
                const formData = {
                    title: previewRequest.title,
                    description: previewRequest.description || '',
                    subject: previewRequest.subject,
                    department: previewRequest.department,
                    topics: Array.isArray(previewRequest.topics)
                        ? previewRequest.topics.join(', ')
                        : (() => {
                            try { return JSON.parse(previewRequest.topics).join(', '); }
                            catch { return previewRequest.topics || ''; }
                        })(),
                    mode: previewRequest.mode,
                    venue: previewRequest.venue || '',
                    meetingLink: previewRequest.meetingLink || '',
                    proposedDate: date.toISOString().split('T')[0],
                    time: date.toTimeString().slice(0, 5),
                    duration: previewRequest.duration,
                    priceType: previewRequest.priceType,
                    price: previewRequest.price,
                    maxSeats: previewRequest.maxSeats
                };
                const mentorUser = {
                    id: previewRequest.mentor?.id,
                    name: previewRequest.mentor?.name,
                    profilePicture: previewRequest.mentor?.profilePicture,
                    department: previewRequest.department,
                };
                return (
                    <SessionPreviewModal
                        formData={formData}
                        user={mentorUser}
                        onClose={() => setPreviewRequest(null)}
                    />
                );
            })()}
        </div>
    );
}
