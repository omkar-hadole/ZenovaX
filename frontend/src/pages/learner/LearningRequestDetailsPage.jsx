import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUp, Check, Users, Calendar, Video, MapPin, X, BookOpen, Share2, FileText } from 'lucide-react';
import { apiCall } from '../../utils/api';
import InlineError from '../../components/InlineError';
import Toast from '../../components/Toast';
import SessionCard from '../../components/dashboard/learner/SessionCard';

const MODE_LABEL = {
    ONLINE: 'Online',
    OFFLINE: 'Offline',
    EITHER: 'Either',
};

const STATUS_META = {
    OPEN: { label: 'Open', className: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500/20' },
    SESSION_CREATED: { label: 'Session Created', className: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-500/20' },
    COMPLETED: { label: 'Completed', className: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' },
    CLOSED: { label: 'Closed', className: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700' },
};

export default function LearningRequestDetailsPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [request, setRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [toast, setToast] = useState(null);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    const fetchRequest = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await apiCall(`/learning-requests/${id}`);
            setRequest(data.request);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to fetch learning request');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequest();
    }, [id]);

    const handleToggleInterest = async () => {
        if (!request || isUpdating) return;
        setIsUpdating(true);
        const wasInterested = request.isInterested;
        setRequest(prev => prev && {
            ...prev,
            isInterested: !wasInterested,
            interestCount: Math.max(0, prev.interestCount + (wasInterested ? -1 : 1))
        });
        try {
            if (wasInterested) {
                await apiCall(`/learning-requests/${request.id}/interested`, { method: 'DELETE' });
            } else {
                await apiCall(`/learning-requests/${request.id}/interested`, { method: 'POST' });
            }
        } catch (err) {
            setRequest(prev => prev && {
                ...prev,
                isInterested: wasInterested,
                interestCount: prev.interestCount + (wasInterested ? 1 : -1)
            });
            setToast({ message: err.message || 'Something went wrong', type: 'error' });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleClose = async () => {
        try {
            await apiCall(`/learning-requests/${request.id}/close`, { method: 'POST' });
            setShowCloseConfirm(false);
            setToast({ message: 'Learning request closed', type: 'success' });
            await fetchRequest();
        } catch (err) {
            setToast({ message: err.message || 'Failed to close request', type: 'error' });
        }
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}/learning-requests/${id}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'ZenovaX Learning Request',
                    text: `Join this learning request: "${request?.topic}"`,
                    url: shareUrl,
                });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                setToast({ message: 'Link copied to clipboard!', type: 'success' });
            }
        } catch (err) {
            if (err?.name === 'AbortError') return;
            try {
                await navigator.clipboard.writeText(shareUrl);
                setToast({ message: 'Link copied to clipboard!', type: 'success' });
            } catch (copyErr) {
                setToast({ message: 'Could not share this request.', type: 'error' });
            }
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto animate-pulse space-y-6">
                <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="h-72 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
                        <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
                    </div>
                    <div className="lg:col-span-4 space-y-6">
                        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
                        <div className="h-56 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="p-4 sm:p-8">
                <InlineError message={error || 'Request not found'} onRetry={fetchRequest} />
            </div>
        );
    }

    const status = STATUS_META[request.status] || STATUS_META.OPEN;
    const session = request.session;
    const isModeOffline = request.preferredMode === 'OFFLINE';

    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-gray-950">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4 flex items-center justify-between">
                        <button
                            onClick={() => navigate('/learning-requests')}
                            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors group"
                        >
                            <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
                                <ArrowLeft size={20} />
                            </div>
                            <span className="font-medium">Learning Requests</span>
                        </button>

                        <button
                            onClick={handleShare}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-all"
                        >
                            <Share2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
                    <div className="lg:col-span-8 space-y-4 sm:space-y-8">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-500/5 dark:to-purple-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700" />

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6 flex-wrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${status.className}`}>
                                        {status.label}
                                    </span>
                                    <span className="px-3 py-1 bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700 rounded-full text-xs font-bold uppercase flex items-center gap-1.5">
                                        {isModeOffline ? <MapPin size={12} /> : <Video size={12} />}
                                        {MODE_LABEL[request.preferredMode] || MODE_LABEL.EITHER}
                                    </span>
                                </div>

                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight">
                                    {request.topic}
                                </h1>

                                <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400">
                                    <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/60 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <Calendar className="text-indigo-500 dark:text-indigo-400" size={18} />
                                        <span className="font-medium text-sm">
                                            {new Date(request.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/60 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <Users className="text-purple-500 dark:text-purple-400" size={18} />
                                        <span className="font-medium text-sm">
                                            {request.interestCount} {request.interestCount === 1 ? 'learner' : 'learners'} interested
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                About this Request
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg whitespace-pre-wrap">
                                {request.description}
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24 space-y-6">
                            {request.status === 'SESSION_CREATED' && session ? (
                                <SessionCard
                                    session={session}
                                    onClick={() => navigate(`/sessions/${session.id}`)}
                                    footer={
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/sessions/${session.id}`); }}
                                            className="flex-1 flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                                        >
                                            <BookOpen className="w-4 h-4" />
                                            View Session
                                        </button>
                                    }
                                />
                            ) : (
                                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                                    {request.status === 'OPEN' ? (
                                        <>
                                            <div className="mb-8">
                                                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">Demand</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                                        {request.interestCount}
                                                    </span>
                                                    <span className="text-gray-400 dark:text-gray-500 text-sm font-medium">
                                                        {request.interestCount === 1 ? 'learner' : 'learners'} want this
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-5 mb-8 bg-gray-50/50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                <p className="text-xs text-center text-gray-400 dark:text-gray-500 font-medium">
                                                    {request.isInterested
                                                        ? 'You\'re supporting this request'
                                                        : 'Show interest so a mentor creates a session for this topic'}
                                                </p>
                                            </div>

                                            <button
                                                onClick={handleToggleInterest}
                                                disabled={isUpdating}
                                                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-60 disabled:hover:translate-y-0 flex items-center justify-center gap-2.5 ${
                                                    request.isInterested
                                                        ? 'bg-[#C9C7F5]/30 text-[#5a59b5] dark:bg-[#C9C7F5]/10 dark:text-[#9190F8] hover:bg-[#C9C7F5]/40 shadow-gray-400/20 dark:shadow-none'
                                                        : 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100 hover:shadow-2xl shadow-gray-400/20 dark:shadow-none'
                                                }`}
                                            >
                                                {isUpdating
                                                    ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                    : request.isInterested ? <Check className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
                                                {request.isInterested ? 'Interested' : "I'm Interested"}
                                            </button>

                                            {request.isCreator && (
                                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
                                                    <button
                                                        onClick={() => setShowCloseConfirm(true)}
                                                        className="text-gray-400 dark:text-gray-500 text-xs font-bold hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-2 mx-auto uppercase tracking-wider group"
                                                    >
                                                        <X className="w-3.5 h-3.5 group-hover:animate-bounce" />
                                                        Close this request
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-4xl font-bold text-gray-400 dark:text-gray-500 mb-2">{request.interestCount}</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                                                This request is {status.label.toLowerCase()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showCloseConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Close this request?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                            No more learners will be able to join. This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCloseConfirm(false)}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClose}
                                className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all"
                            >
                                Close Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}