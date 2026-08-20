import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Monitor, MapPin, Layers, Calendar, Plus, ArrowUp, CheckCircle2, EyeOff } from 'lucide-react';
import { apiCall } from '../../utils/api';
import InlineError from '../../components/InlineError';
import Toast from '../../components/Toast';

const MODE_LABEL = {
    ONLINE: { label: 'Online', Icon: Monitor },
    OFFLINE: { label: 'Offline', Icon: MapPin },
    EITHER: { label: 'Either', Icon: Layers },
};

export default function MentorLearningRequestsPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const fetchRequests = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await apiCall('/learning-requests/mentor-demand?limit=50');
            setRequests(data.requests || []);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to fetch learner demand');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleCreateSession = (request) => {
        navigate(`/mentor/create-session?requestId=${request.id}`);
    };

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <InlineError message={error} onRetry={fetchRequests} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Learner Demand</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Topics learners are asking for, sorted by how many want them.
                </p>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ArrowUp className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No learning requests yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">Learners haven't asked for any sessions yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request, index) => {
                        const mode = MODE_LABEL[request.preferredMode] || MODE_LABEL.EITHER;
                        const ModeIcon = mode.Icon;
                        return (
                            <div
                                key={request.id}
                                className="bg-white dark:bg-gray-900 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
                                    <div className="flex items-center gap-4 lg:w-16 shrink-0">
                                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold ${index === 0
                                            ? 'bg-[#C9C7F5] text-[#5a59b5]'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                            }`}>
                                            <ArrowUp className="w-4 h-4" />
                                            <span className="text-sm">{request.interestCount}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg truncate">{request.topic}</h3>
                                            {request.status === 'SESSION_CREATED' && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                                                    Session created
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                                            {request.description}
                                        </p>
                                        <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" />
                                                {request.interestCount} interested
                                            </span>
                                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                                            <span className="flex items-center gap-1.5">
                                                <ModeIcon className="w-3.5 h-3.5" />
                                                {mode.label}
                                            </span>
                                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                                            <span className="flex items-center gap-1.5">
                                                {request.isAnonymous
                                                    ? 'Anonymous'
                                                    : `${request.creator?.department || 'Learner'}${request.creator?.year ? ` · Year ${request.creator.year}` : ''}`}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="shrink-0">
                                        {request.status === 'OPEN' ? (
                                            <button
                                                onClick={() => handleCreateSession(request)}
                                                className="flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-lg"
                                            >
                                                <Plus className="w-4 h-4" />
                                                Create Session
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => request.session?.id && navigate(`/mentor/session/${request.session.id}`)}
                                                className="flex items-center gap-2 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-200 dark:hover:bg-green-500/20 transition-all"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                View Session
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}