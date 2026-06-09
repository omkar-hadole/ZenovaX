import React, { useState, useEffect } from 'react';
import { apiCall } from '../../utils/api';
import { Trash2, ExternalLink } from 'lucide-react';
import Pagination from '../../components/common/Pagination';

export default function AllSessions() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

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

    const handleDelete = async (sessionId) => {
        if (!window.confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;
        try {
            await apiCall(`/admin/sessions/${sessionId}`, 'DELETE');
            fetchSessions(currentPage);
        } catch (error) {
            console.error("Failed to delete session", error);
            alert("Failed to delete session");
        }
    };

    if (loading) return <div className="p-8">Loading sessions...</div>;

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">All Sessions</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mentor</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sessions.map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{session.title}</div>
                                        <div className="text-xs text-gray-500">{session.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {session.mentor?.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(session.scheduledAt).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${session.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                                            session.status === 'LIVE' ? 'bg-red-100 text-red-700' :
                                                session.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {session.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {session.price > 0 ? `₹${session.price}` : 'Free'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(session.id)}
                                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Delete Session"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        No sessions found.
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
