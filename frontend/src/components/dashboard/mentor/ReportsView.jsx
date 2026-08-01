import React, { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Search, Calendar, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { apiCall } from '../../../utils/api';
import ReportsSkeleton from './ReportsSkeleton';

import { useNavigate } from 'react-router-dom';

const STATUS_FILTERS = ['ALL', 'PENDING', 'RESOLVED', 'IGNORED'];

export default function ReportsView() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const data = await apiCall('/reports/my-reports');
            setReports(data.reports || []);
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20';
            case 'RESOLVED': return 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20';
            case 'IGNORED': return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700';
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
        }
    };

    const filteredReports = useMemo(() => {
        const query = search.trim().toLowerCase();
        return reports.filter((report) => {
            if (filter !== 'ALL' && report.status !== filter) return false;
            if (!query) return true;
            return (
                report.session?.title?.toLowerCase().includes(query) ||
                report.reason?.toLowerCase().includes(query)
            );
        });
    }, [reports, filter, search]);

    const pendingCount = reports.filter(r => r.status === 'PENDING').length;
    const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;

    if (loading) {
        return <ReportsSkeleton />;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-red-100 dark:border-red-500/20 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-2 truncate">Total Reports</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">{reports.length}</span>
                            <div className="flex items-center mb-2 px-2 py-1 bg-red-100 dark:bg-red-500/10 rounded-lg text-red-500 dark:text-red-400 shrink-0">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-[#F7D483]/30 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#F7D483]/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-2 truncate">Pending Review</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl sm:text-4xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</span>
                            <div className="flex items-center mb-2 px-2 py-1 bg-[#F7D483]/20 rounded-lg text-[#b59a5a] shrink-0">
                                <Clock className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-[1.5rem] shadow-sm border border-green-100 dark:border-green-500/20 relative overflow-hidden group hover:shadow-md transition-all col-span-2 md:col-span-1">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 dark:bg-green-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <h3 className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium mb-2 truncate">Resolved</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">{resolvedCount}</span>
                            <div className="flex items-center mb-2 px-2 py-1 bg-green-100 dark:bg-green-500/10 rounded-lg text-green-600 dark:text-green-400 shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Issue Reports</h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Feedback and issues reported by learners</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="bg-gray-50 dark:bg-gray-800/60 p-1 rounded-xl flex items-center overflow-x-auto max-w-full">
                            {STATUS_FILTERS.map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilter(status)}
                                    className={`shrink-0 whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === status
                                        ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                >
                                    {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search reports..."
                                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800/60 dark:text-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#C9C7F5] outline-none border-none w-full sm:w-52"
                            />
                        </div>
                    </div>
                </div>

                {reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500">
                        <div className="w-16 h-16 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="text-green-500 dark:text-green-400 w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">No Issues Reported</h3>
                        <p className="text-gray-500 dark:text-gray-400">Great job! Your sessions are running smoothly.</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-500">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/60 rounded-full flex items-center justify-center mb-4">
                            <Search className="text-gray-300 dark:text-gray-600 w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">No matching reports</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try a different filter or search term.</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-8 py-4">Session</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {filteredReports.map((report, index) => (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors animate-in fade-in slide-in-from-bottom-1 duration-300"
                                        style={{ animationDelay: `${Math.min(index, 8) * 40}ms`, animationFillMode: 'backwards' }}
                                    >
                                        <td className="px-8 py-4">
                                            <p className="font-bold text-gray-800 dark:text-gray-100">{report.session?.title || 'Unknown Session'}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative group cursor-help">
                                                <div className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs" title={report.reason}>{report.reason}</div>
                                                {/* Custom Tooltip */}
                                                <div className="absolute left-0 bottom-full mb-2 w-80 p-4 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl z-[100] whitespace-normal break-words leading-relaxed">
                                                    {report.reason}
                                                    <div className="absolute left-4 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(report.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(report.status)}`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => report.sessionId && navigate(`/mentor/session/${report.sessionId}`)}
                                                className="text-[#5a59b5] text-sm font-bold hover:underline disabled:opacity-50 disabled:hover:no-underline"
                                                disabled={!report.sessionId}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>

                        <div className="md:hidden divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredReports.map((report) => (
                                <div key={report.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm min-w-0 break-words">
                                            {report.session?.title || 'Unknown Session'}
                                        </p>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${getStatusColor(report.status)}`}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2 break-words">{report.reason}</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </div>
                                        {report.sessionId && (
                                            <button
                                                onClick={() => navigate(`/mentor/session/${report.sessionId}`)}
                                                className="text-[#5a59b5] text-sm font-bold hover:underline"
                                            >
                                                View
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
