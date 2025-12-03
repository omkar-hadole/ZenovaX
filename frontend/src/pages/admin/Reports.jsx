import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { Trash2, EyeOff, Flag } from 'lucide-react';

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await apiCall('/admin/reports');
            setReports(data);
        } catch (error) {
            console.error("Failed to fetch reports", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleAction = async (reportId, action) => {
        const confirmMsg = action === 'DELETE_SESSION'
            ? "Are you sure you want to delete the reported session?"
            : "Are you sure you want to ignore this report?";

        if (!window.confirm(confirmMsg)) return;

        try {
            await apiCall('/admin/reports/action', 'POST', { reportId, action });
            fetchReports();
        } catch (error) {
            console.error("Failed to handle report action", error);
            alert("Failed to process action");
        }
    };

    if (loading) return <div className="p-8">Loading reports...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports / Flagged Content</h1>

            <div className="grid gap-6">
                {reports.map((report) => (
                    <div key={report.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${report.status === 'PENDING' ? 'bg-red-100 text-red-700' :
                                        report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    <Flag className="w-3 h-3" /> {report.status}
                                </span>
                                <span className="text-sm text-gray-500">
                                    Reported on {new Date(report.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Session: {report.session?.title || <span className="text-red-500 italic">Deleted Session</span>}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                                <span className="font-medium">Reason:</span> {report.reason}
                            </p>
                            <p className="text-gray-500 text-xs">
                                Reported by: {report.reporter?.name}
                            </p>
                        </div>

                        {report.status === 'PENDING' && (
                            <div className="flex items-center gap-3 md:border-l md:pl-6 border-gray-100">
                                <button
                                    onClick={() => handleAction(report.id, 'DELETE_SESSION')}
                                    className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                                    disabled={!report.session}
                                >
                                    <Trash2 className="w-4 h-4" /> Delete Session
                                </button>
                                <button
                                    onClick={() => handleAction(report.id, 'IGNORE')}
                                    className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                                >
                                    <EyeOff className="w-4 h-4" /> Ignore
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {reports.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-500">No reports found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
