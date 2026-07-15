import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import MentorSidebar from '../components/dashboard/mentor/MentorSidebar';
import QRScanner from '../components/dashboard/mentor/QRScanner';
import ErrorBoundary from '../components/ErrorBoundary';
import Toast from '../components/Toast';
import { QrCode } from 'lucide-react';

export default function MentorLayout() {
    const { user } = useAuth();

    const [mySessions, setMySessions] = useState([]);
    const [sessionRequests, setSessionRequests] = useState([]);
    const [stats, setStats] = useState({
        totalSessions: 0,
        totalLearners: 0,
        totalHours: 0,
        averageRating: 0
    });
    const [reviewStats, setReviewStats] = useState(null);

    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);
    const [toast, setToast] = useState(null);
    const [errors, setErrors] = useState({
        sessions: null,
        requests: null,
        stats: null
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setErrors({ sessions: null, requests: null, stats: null });
                await Promise.all([
                    fetchMySessions(),
                    fetchSessionRequests(),
                    fetchStats()
                ]);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const fetchMySessions = async () => {
        try {
            const data = await apiCall('/sessions/my-sessions');
            setMySessions(data.sessions || []);
            setErrors(prev => ({ ...prev, sessions: null }));
        } catch (error) {
            console.error('Failed to fetch sessions', error);
            setErrors(prev => ({ ...prev, sessions: error.message || 'Failed to fetch sessions' }));
        }
    };

    const fetchSessionRequests = async () => {
        try {
            const data = await apiCall('/sessions/my-requests');
            setSessionRequests(data.requests || []);
            setErrors(prev => ({ ...prev, requests: null }));
        } catch (error) {
            console.error('Failed to fetch requests', error);
            setErrors(prev => ({ ...prev, requests: error.message || 'Failed to fetch requests' }));
        }
    };

    const fetchStats = async () => {
        try {
            const data = await apiCall('/sessions/stats');
            if (data.stats) {
                setStats(data.stats);
            }
            setErrors(prev => ({ ...prev, stats: null }));
        } catch (error) {
            console.error('Failed to fetch stats', error);
            setErrors(prev => ({ ...prev, stats: error.message || 'Failed to fetch stats' }));
        }
    };

    return (
        <ErrorBoundary>
            <div className="flex h-screen bg-[#F4F4F9] dark:bg-gray-950 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 dark:bg-purple-500/10 blur-[100px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[100px]" />
                </div>

                <div className="relative z-10 flex h-full w-full">
                    <MentorSidebar />

                    <main className="flex-1 overflow-y-auto">
                        <Header user={user || {}} title={`Hello, ${user?.name || 'Mentor'}!`} searchPlaceholder="Search sessions, learners..." />

                        <div className="p-8">
                            <ErrorBoundary>
                                <Outlet context={{
                                    mySessions,
                                    sessionRequests,
                                    stats,
                                    reviewStats,
                                    loading,
                                    errors,
                                    fetchMySessions,
                                    fetchSessionRequests,
                                    fetchStats,
                                    setShowScanner,
                                }} />
                            </ErrorBoundary>
                        </div>
                    </main>
                </div>

                {/* QR Scanner Modal */}
                {showScanner && (
                    <QRScanner
                        onClose={() => setShowScanner(false)}
                        onCameraError={(msg) => setToast({ message: msg, type: 'error' })}
                    />
                )}

                {/* Mobile Scan FAB */}
                <button
                    onClick={() => setShowScanner(true)}
                    className="md:hidden fixed bottom-6 right-6 z-50 bg-black text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform border border-white/20"
                >
                    <QrCode className="w-6 h-6" />
                </button>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </ErrorBoundary>
    );
}
