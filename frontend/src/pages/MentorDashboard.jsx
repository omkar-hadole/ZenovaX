import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiCall } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/dashboard/Header';
import MySessions from '../components/dashboard/mentor/MySessions';
import MentorDashboardView from '../components/dashboard/mentor/MentorDashboardView';
import ReviewsReceived from '../components/dashboard/mentor/ReviewsReceived';
import MentorSessionsSkeleton from '../components/dashboard/mentor/MentorSessionsSkeleton';
import ReviewsSkeleton from '../components/dashboard/mentor/ReviewsSkeleton';
import QRScanner from '../components/dashboard/mentor/QRScanner';
import LaunchCodingQuestion from './LaunchCodingQuestion';
import ReportsView from '../components/dashboard/mentor/ReportsView';
import ScanAttendanceView from '../components/dashboard/mentor/ScanAttendanceView';
import MentorSidebar from '../components/dashboard/mentor/MentorSidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import InlineError from '../components/InlineError';
import Toast from '../components/Toast';
import {
  Settings,
  QrCode
} from 'lucide-react';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Initialize tab from query param or default to 'Dashboard'
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'Dashboard');

  // Update active tab when URL query param changes (e.g. back button)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

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
      <div className="flex h-screen bg-[#F4F4F9] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px]" />
        </div>

        <div className="relative z-10 flex h-full w-full">
          <MentorSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
            }}
          />

          <main className="flex-1 overflow-y-auto">
            <Header user={user || {}} title={`Hello, ${user?.name || 'Mentor'}!`} searchPlaceholder="Search sessions, learners..." />

            <div className="p-8">
              <ErrorBoundary>
                {activeTab === 'Dashboard' ? (
                  <MentorDashboardView
                    stats={stats}
                    mySessions={mySessions}
                    sessionRequests={sessionRequests}
                    reviewStats={reviewStats}
                    setActiveTab={setActiveTab}
                    loading={loading}
                    errors={errors}
                    onRetrySessions={fetchMySessions}
                    onRetryRequests={fetchSessionRequests}
                    onRetryStats={fetchStats}
                  />
                ) : activeTab === 'Launch Code' ? (
                  <LaunchCodingQuestion setActiveTab={setActiveTab} mySessions={mySessions} />
                ) : activeTab === 'My Sessions' ? (
                  loading ? (
                    <MentorSessionsSkeleton />
                  ) : errors.sessions || errors.requests ? (
                    <InlineError
                      message={errors.sessions || errors.requests}
                      onRetry={() => {
                        if (errors.sessions) fetchMySessions();
                        if (errors.requests) fetchSessionRequests();
                      }}
                    />
                  ) : (
                    <MySessions sessions={[
                      ...mySessions,
                      ...sessionRequests.filter(req => req.status === 'PENDING').map(req => ({
                        id: `req-${req.id}`,
                        title: req.title,
                        scheduledAt: req.proposedDate,
                        duration: req.duration,
                        mode: req.mode,
                        isRequest: true,
                        status: req.status,
                        _count: { bookings: 0 }
                      }))
                    ].sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))} />
                  )
                ) : activeTab === 'Reviews Received' ? (
                  loading ? <ReviewsSkeleton /> : <ReviewsReceived />
                ) : activeTab === 'Reports' ? (
                  loading ? <div className="p-12 text-center">Loading...</div> : <ReportsView />
                ) : activeTab === 'Scan Attendance' ? (
                  <ScanAttendanceView onOpenScanner={() => setShowScanner(true)} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Settings className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Coming Soon</h3>
                    <p>This feature is currently under development.</p>
                  </div>
                )}
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
