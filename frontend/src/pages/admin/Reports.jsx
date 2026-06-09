import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { Trash2, Edit, Flag, CheckCircle, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../components/common/Pagination';

export default function Reports() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

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



    const handleAction = async (reportId, action) => {
        let confirmMsg = "";
        switch (action) {
            case 'DELETE_SESSION': confirmMsg = "Are you sure you want to delete the reported session?"; break;
            case 'RESOLVE': confirmMsg = "Are you sure you want to resolve this report?"; break;
            default: return;
        }

        if (!window.confirm(confirmMsg)) return;

        try {
            await apiCall('/admin/reports/action', 'POST', { reportId, action });
            fetchReports(currentPage);
        } catch (error) {
            console.error("Failed to handle report action", error);
            alert("Failed to process action");
        }
    };

    const handleEdit = (sessionId) => {
        if (!sessionId) return;
        if (!window.confirm("Are you sure you want to edit this session? This will take you to the session editing page.")) return;
        navigate(`/mentor/edit-session/${sessionId}`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'IGNORED': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const filteredReports = filter === 'ALL' ? reports : reports.filter(r => r.status === filter);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-[#5d5c9e] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and resolve reported sessions</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    {['ALL', 'PENDING', 'RESOLVED', 'IGNORED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === status
                                ? 'bg-black text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100">
                <div className="overflow-x-auto md:overflow-visible">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5">Session</th>
                                <th className="px-6 py-5">Reason</th>
                                <th className="px-6 py-5">Reported By</th>
                                <th className="px-6 py-5">Date</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredReports.length > 0 ? (
                                filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <p className="font-bold text-gray-800">{report.session?.title || <span className="text-red-400 italic">Deleted Session</span>}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative group cursor-help">
                                                <p className="text-sm text-gray-600 max-w-xs truncate" title={report.reason}>{report.reason}</p>
                                                {/* Custom Tooltip */}
                                                <div className="absolute left-0 bottom-full mb-2 w-80 p-4 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl z-[100] whitespace-normal break-words leading-relaxed">
                                                    {report.reason}
                                                    <div className="absolute left-4 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative group flex items-center gap-2 cursor-pointer">
                                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                                                    {report.reporter?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium">
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
                                            <span className="text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
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
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Resolve"
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEdit(report.session?.requestId)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Session"
                                                            disabled={!report.session?.requestId}
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(report.id, 'DELETE_SESSION')}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Session"
                                                            disabled={!report.session}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {report.status !== 'PENDING' && (
                                                    <span className="text-xs text-gray-400 italic">No actions</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-8 py-12 text-center text-gray-500">
                                        No reports found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}
