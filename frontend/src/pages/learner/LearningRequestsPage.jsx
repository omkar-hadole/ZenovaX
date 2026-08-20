import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, GraduationCap } from 'lucide-react';
import { apiCall } from '../../utils/api';
import InlineError from '../../components/InlineError';
import Toast from '../../components/Toast';
import Pagination from '../../components/common/Pagination';
import SessionSkeleton from '../../components/dashboard/SessionSkeleton';
import LearningRequestCard from '../../components/dashboard/learner/LearningRequestCard';
import CreateLearningRequestModal from '../../components/dashboard/learner/CreateLearningRequestModal';

export default function LearningRequestsPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [modeFilter, setModeFilter] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        const timeout = setTimeout(() => setSearch(searchInput.trim()), 400);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const fetchRequests = async (pageNum = 1, term = search, mode = modeFilter) => {
        try {
            setIsLoading(true);
            setError(null);

            let query = `/learning-requests?page=${pageNum}&limit=9`;
            if (term) query += `&search=${encodeURIComponent(term)}`;
            if (mode) query += `&mode=${mode}`;

            const data = await apiCall(query);
            setRequests(data.requests || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setPage(pageNum);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to fetch learning requests');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests(1, search, modeFilter);
    }, [search, modeFilter]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchRequests(newPage, search, modeFilter);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleCreate = async (payload) => {
        const data = await apiCall('/learning-requests', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        setShowCreate(false);
        setSearchInput('');
        setModeFilter('');
        setToast({ message: data.message || 'Learning request created', type: 'success' });
        await fetchRequests(1, '', '');
        if (data.request?.id) {
            navigate(`/learning-requests/${data.request.id}`);
        }
    };

    const handleToggleInterest = async (request) => {
        if (updatingId) return;
        setUpdatingId(request.id);

        const wasInterested = request.isInterested;
        setRequests(prev => prev.map(r => r.id === request.id
            ? { ...r, isInterested: !wasInterested, interestCount: Math.max(0, r.interestCount + (wasInterested ? -1 : 1)) }
            : r));

        try {
            if (wasInterested) {
                await apiCall(`/learning-requests/${request.id}/interested`, { method: 'DELETE' });
            } else {
                await apiCall(`/learning-requests/${request.id}/interested`, { method: 'POST' });
            }
        } catch (err) {
            setRequests(prev => prev.map(r => r.id === request.id
                ? { ...r, isInterested: wasInterested, interestCount: r.interestCount + (wasInterested ? 1 : -1) }
                : r));
            setToast({ message: err.message || 'Something went wrong', type: 'error' });
        } finally {
            setUpdatingId(null);
        }
    };

    const openRequest = (request) => {
        navigate(`/learning-requests/${request.id}`);
    };

    return (
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Learning Requests</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Ask for a session on a topic — others can join your request.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search topics..."
                            className="pl-11 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black/5 w-full sm:w-56 transition-all"
                        />
                    </div>

                    <select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value)}
                        className="appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-full px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black/5 cursor-pointer"
                    >
                        <option value="">All Modes</option>
                        <option value="ONLINE">Online</option>
                        <option value="OFFLINE">Offline</option>
                        <option value="EITHER">Either</option>
                    </select>

                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-lg"
                    >
                        <Plus className="w-4 h-4" />
                        New Request
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <SessionSkeleton key={i} />)}
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GraduationCap className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">No learning requests found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Be the first to ask for a session on a topic.</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black px-5 py-2.5 rounded-full text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Create a Request
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {requests.map((request) => (
                            <LearningRequestCard
                                key={request.id}
                                request={request}
                                onOpen={openRequest}
                                onToggleInterest={handleToggleInterest}
                                isUpdatingInterest={updatingId === request.id}
                            />
                        ))}
                    </div>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                </>
            )}

            {error && (
                <div className="mt-6">
                    <InlineError message={error} onRetry={() => fetchRequests(page, search, modeFilter)} />
                </div>
            )}

            {showCreate && (
                <CreateLearningRequestModal
                    onClose={() => setShowCreate(false)}
                    onCreate={handleCreate}
                />
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}