import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code, Search, Plus, Rocket, Eye, XCircle, Pencil, Users } from 'lucide-react';
import { apiCall } from '../../../utils/api';
import Toast from '../../Toast';
import ConfirmModal from '../../common/ConfirmModal';

const STATUS_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'LIVE', label: 'Live' },
    { value: 'CLOSED', label: 'Closed' },
];

const STATUS_BADGE = {
    DRAFT: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
    LIVE: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    CLOSED: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

const DIFFICULTY_BADGE = {
    EASY: 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400',
    MEDIUM: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    HARD: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400',
};

export default function MyCodingQuestions() {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchInput, setSearchInput] = useState('');
    const [toast, setToast] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [confirmTarget, setConfirmTarget] = useState(null); // { id, action: 'launch' | 'close' }

    const fetchQuestions = async () => {
        try {
            const data = await apiCall('/coding-questions/mine');
            setQuestions(data.questions || []);
        } catch (error) {
            console.error('Failed to fetch coding questions', error);
            setToast({ message: 'Failed to load coding questions', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const filteredQuestions = questions.filter((q) => {
        const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
        const matchesSearch = !searchInput.trim() || q.title?.toLowerCase().includes(searchInput.trim().toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const runAction = async (id, action) => {
        setBusyId(id);
        try {
            if (action === 'launch') {
                await apiCall(`/coding-questions/${id}/launch`, 'PUT');
                setToast({ message: 'Question launched — now live for students', type: 'success' });
            } else if (action === 'close') {
                await apiCall(`/coding-questions/${id}/close`, 'PUT');
                setToast({ message: 'Question closed', type: 'success' });
            }
            await fetchQuestions();
        } catch (error) {
            console.error(`Failed to ${action} question`, error);
            setToast({ message: error.message || `Failed to ${action} question`, type: 'error' });
        } finally {
            setBusyId(null);
            setConfirmTarget(null);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">My Coding Questions</h2>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center">
                        {STATUS_FILTERS.map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setStatusFilter(f.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === f.value
                                    ? 'bg-white dark:bg-gray-900 text-black dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search questions..."
                            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#C9C7F5] outline-none border-none w-full sm:w-64"
                        />
                    </div>

                    <button
                        onClick={() => navigate('/mentor/launch-code')}
                        className="flex items-center gap-1.5 bg-[#C9C7F5] text-[#5a59b5] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#b8b6e5] transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus className="w-4 h-4" /> New Question
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuestions.length > 0 ? (
                    filteredQuestions.map((q) => (
                        <div
                            key={q.id}
                            className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-[1.5rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${STATUS_BADGE[q.status]}`}>
                                        {q.status}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${DIFFICULTY_BADGE[q.difficulty] || DIFFICULTY_BADGE.MEDIUM}`}>
                                        {q.difficulty}
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-1">{q.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                                {q.session?.title || 'Unknown session'}
                            </p>

                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1.5 rounded-lg w-fit mb-6">
                                <Users size={14} className="text-[#A9C1F7]" />
                                {q.submissionCount} submission{q.submissionCount === 1 ? '' : 's'}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-auto">
                                {q.status !== 'CLOSED' && (
                                    <button
                                        onClick={() => navigate(`/mentor/launch-code/${q.id}`)}
                                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <Pencil size={14} /> Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate(`/mentor/coding-questions/${q.id}/preview`)}
                                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Eye size={14} /> Preview
                                </button>
                                {q.status === 'DRAFT' && (
                                    <button
                                        disabled={busyId === q.id}
                                        onClick={() => setConfirmTarget({ id: q.id, action: 'launch' })}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                    >
                                        <Rocket size={14} /> Launch
                                    </button>
                                )}
                                {(q.status === 'DRAFT' || q.status === 'LIVE') && (
                                    <button
                                        disabled={busyId === q.id}
                                        onClick={() => setConfirmTarget({ id: q.id, action: 'close' })}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                                    >
                                        <XCircle size={14} /> Close
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-gray-900 rounded-[1.5rem] border border-dashed border-gray-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/60 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-500">
                            <Code size={24} />
                        </div>
                        <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No coding questions found</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Try changing the filter or create a new question.</p>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={!!confirmTarget}
                title={confirmTarget?.action === 'launch' ? 'Launch this question?' : 'Close this question?'}
                message={
                    confirmTarget?.action === 'launch'
                        ? 'Students booked into this session will be notified and can start attempting it immediately.'
                        : 'Closing stops new attempts and submissions. This cannot be undone from here.'
                }
                confirmText={confirmTarget?.action === 'launch' ? 'Launch' : 'Close'}
                type={confirmTarget?.action === 'launch' ? 'default' : 'danger'}
                onCancel={() => setConfirmTarget(null)}
                onConfirm={() => confirmTarget && runAction(confirmTarget.id, confirmTarget.action)}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
