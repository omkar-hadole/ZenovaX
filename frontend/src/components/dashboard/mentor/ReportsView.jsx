import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, Calendar, ShieldCheck } from 'lucide-react';
import { apiCall } from '../../../utils/api';

import { useNavigate } from 'react-router-dom';

export default function ReportsView() {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

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
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200';
            case 'IGNORED': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-8 h-8 border-4 border-[#C9C7F5] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-red-100 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-500 font-medium mb-1">Total Reports</p>
                        <h3 className="text-3xl font-bold text-gray-800">{reports.length}</h3>
                    </div>
                    <div className="absolute right-[-10px] bottom-[-10px] text-red-50 opacity-50 transform rotate-12">
                        <AlertTriangle size={80} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-yellow-100">
                    <p className="text-gray-500 font-medium mb-1">Pending Review</p>
                    <h3 className="text-3xl font-bold text-yellow-600">
                        {reports.filter(r => r.status === 'PENDING').length}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-green-100">
                    <p className="text-gray-500 font-medium mb-1">Resolved</p>
                    <h3 className="text-3xl font-bold text-green-600">
                        {reports.filter(r => r.status === 'RESOLVED').length}
                    </h3>
                </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Issue Reports</h2>
                        <p className="text-gray-500 text-sm">Feedback and issues reported by learners</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search reports..."
                                className="pl-10 pr-4 py-2 bg-gray-50 rounded-xl text-sm focus:ring-2 focus:ring-[#C9C7F5] outline-none border-none"
                            />
                        </div>
                    </div>
                </div>

                {reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <ShieldCheck className="text-green-500 w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">No Issues Reported</h3>
                        <p className="text-gray-500">Great job! Your sessions are running smoothly.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto md:overflow-visible">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                                <tr>
                                    <th className="px-8 py-4">Session</th>
                                    <th className="px-6 py-4">Reason</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-4">
                                            <p className="font-bold text-gray-800">{report.session?.title || 'Unknown Session'}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="relative group cursor-help">
                                                <div className="text-sm text-gray-900 truncate max-w-xs" title={report.reason}>{report.reason}</div>
                                                {/* Custom Tooltip */}
                                                <div className="absolute left-0 bottom-full mb-2 w-80 p-4 bg-gray-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl z-[100] whitespace-normal break-words leading-relaxed">
                                                    {report.reason}
                                                    <div className="absolute left-4 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
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
                )}
            </div>
        </div >
    );
}
