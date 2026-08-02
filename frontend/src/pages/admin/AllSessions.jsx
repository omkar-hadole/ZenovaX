import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { Trash2, ExternalLink, Users, Calendar } from 'lucide-react';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import Toast from '../../components/Toast';
import { AdminListSkeleton } from '../../components/common/AdminSkeletons';

export default function AllSessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const fetchSessions = async (page) => {
        try {
            setLoading(true);
            const data = await apiCall(`/admin/sessions?page=${page}&limit=${itemsPerPage}`);
            setSessions(data.sessions || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions(currentPage);
    }, [currentPage]);

    const handleDelete = (sessionId) => {
        setConfirmModal({
            isOpen: true,
            title: "Delete Session",
            message: "Are you sure you want to delete this session? This action cannot be undone.",
            confirmText: "Delete",
            type: "danger",
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await apiCall(`/admin/sessions/${sessionId}`, 'DELETE');
                    setToast({ message: 'Session deleted successfully!', type: 'success' });
                    fetchSessions(currentPage);
                } catch (error) {
                    console.error("Failed to delete session", error);
                    setToast({ message: "Failed to delete session", type: 'error' });
                }
            }
        });
    };

    if (loading) return <AdminListSkeleton />;

    return (
        <div className="p-4 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">All Sessions</h1>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/60">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mentor</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.title}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{session.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {session.mentor?.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(session.scheduledAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${session.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                            session.status === 'LIVE' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                                                session.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {session.price > 0 ? `₹${session.price}` : 'Free'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(session.id)}
                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                            title="Delete Session"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No sessions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                    {sessions.map((session) => (
                        <div key={session.id} className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{session.title}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{session.subject}</div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold shrink-0 ${session.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                    session.status === 'LIVE' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                                        session.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' :
                                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    }`}>
                                    {session.status}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0"><Users className="w-3.5 h-3.5 shrink-0" /> <span className="min-w-0">{session.mentor?.name}</span></div>
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0"><Calendar className="w-3.5 h-3.5 shrink-0" /> <span className="min-w-0">{new Date(session.scheduledAt).toLocaleString()}</span></div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{session.price > 0 ? `₹${session.price}` : 'Free'}</span>
                                <button
                                    onClick={() => handleDelete(session.id)}
                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    title="Delete Session"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">No sessions found.</div>
                    )}
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
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
        </div>
    );
}
