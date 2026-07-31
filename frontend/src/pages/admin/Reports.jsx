import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { Trash2, Edit, Flag, CheckCircle, Search, Filter, User, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import Toast from '../../components/Toast';

export default function Reports() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

    const fetchReports = async (page) => {
        try {
            setLoading(true);
            const data = await apiCall(`/admin/reports?page=${page}&limit=${itemsPerPage}`);
            setReports(data.reports || []);
            setTotalPages(data.pagination?.totalPages || 1);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports(currentPage);
    }, [currentPage]);



    const handleAction = (reportId, action) => {
        let confirmMsg = "";
        let title = "";
        let type = "danger";
        switch (action) {
            case 'DELETE_SESSION': 
                confirmMsg = "Are you sure you want to delete the reported session?"; 
                title = "Delete Reported Session";
                type = "danger";
                break;
            case 'RESOLVE': 
                confirmMsg = "Are you sure you want to resolve this report?"; 
                title = "Resolve Report";
                type = "info";
                break;
            default: return;
        }

        setConfirmModal({
            isOpen: true,
            title,
            message: confirmMsg,
            type,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    await apiCall('/admin/reports/action', 'POST', { reportId, action });
                    setToast({ message: 'Action processed successfully!', type: 'success' });
                    fetchReports(currentPage);
                } catch (error) {
                    console.error("Failed to handle report action", error);
                    setToast({ message: "Failed to process action", type: 'error' });
                }
            }
        });
    };

    const handleEdit = (sessionId) => {
        if (!sessionId) return;
        setConfirmModal({
            isOpen: true,
            title: "Edit Session",
            message: "Are you sure you want to edit this session? This will take you to the session editing page.",
            type: "info",
            onConfirm: () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                navigate(`/mentor/edit-session/${sessionId}`);
            }
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20';
            case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
            case 'IGNORED': return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
            default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const filteredReports = filter === 'ALL' ? reports : reports.filter(r => r.status === filter);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-[#5d5c9e] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-4 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage and resolve reported sessions</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    {['ALL', 'PENDING', 'RESOLVED', 'IGNORED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                                ? 'bg-black text-white shadow-md'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-8 py-5">Session</th>
                                <th className="px-6 py-5">Reason</th>
                                <th className="px-6 py-5">Reported By</th>
                                <th className="px-6 py-5">Date</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/60 transition-colors">
                                        <td className="px-8 py-4">
                                            <p className="font-bold text-gray-800 dark:text-gray-200">{report.session?.title || <span className="text-red-400 dark:text-red-400 italic">Deleted Session</span>}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative group cursor-help">
                                                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate" title={report.reason}>{report.reason}</p>
                                                {/* Custom Tooltip */}
                                                <div className="absolute left-0 bottom-full mb-2 w-80 p-4 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl z-[100] whitespace-normal break-words leading-relaxed">
                                                    {report.reason}
                                                    <div className="absolute left-4 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative group flex items-center gap-2 cursor-pointer">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                                                    {report.reporter?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                    {report.reporter?.name}
                                                </span>

                                                {/* Custom Hover Tooltip */}
                                                <div className="absolute left-0 bottom-full mb-2 w-max max-w-[200px] px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-10">
                                                    {report.reporter?.email || "No email available"}
                                                    {/* Triangle pointer */}
                                                    <div className="absolute left-4 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(report.status)}`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {report.status === 'PENDING' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(report.id, 'RESOLVE')}
                                                            className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                                                            title="Resolve"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(report.session?.requestId)}
                                                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                            title="Edit Session"
                                                            disabled={!report.session?.requestId}
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(report.id, 'DELETE_SESSION')}
                                                            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                            title="Delete Session"
                                                            disabled={!report.session}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {report.status !== 'PENDING' && (
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 italic">No actions</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No reports found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredReports.length > 0 ? (
                        filteredReports.map((report) => (
                            <div key={report.id} className="p-5">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                        {report.session?.title || <span className="text-red-400 italic">Deleted Session</span>}
                                    </p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${getStatusColor(report.status)}`}>
                                        {report.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{report.reason}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {report.reporter?.name}</span>
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(report.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center justify-end gap-2 mt-3">
                                    {report.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleAction(report.id, 'RESOLVE')}
                                                className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                                                title="Resolve"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(report.session?.requestId)}
                                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                                title="Edit Session"
                                                disabled={!report.session?.requestId}
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleAction(report.id, 'DELETE_SESSION')}
                                                className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Delete Session"
                                                disabled={!report.session}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </>
                                    )}
                                    {report.status !== 'PENDING' && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">No actions</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-8 py-12 text-center text-gray-500 dark:text-gray-400">No reports found.</div>
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
