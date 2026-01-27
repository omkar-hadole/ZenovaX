import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Star,
  HelpCircle,
  Settings,
  QrCode,
  Code
} from 'lucide-react';

import { apiCall } from '../utils/api';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import MySessions from '../components/dashboard/mentor/MySessions';
import MentorDashboardView from '../components/dashboard/mentor/MentorDashboardView';
import ReviewsReceived from '../components/dashboard/mentor/ReviewsReceived';
import MentorSessionsSkeleton from '../components/dashboard/mentor/MentorSessionsSkeleton';
import ReviewsSkeleton from '../components/dashboard/mentor/ReviewsSkeleton';
import QRScanner from '../components/dashboard/mentor/QRScanner';
import LaunchCodingQuestion from './LaunchCodingQuestion';
import logo from '../assets/mentorlogo.svg';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [activeTab, setActiveTab] = useState('Dashboard');
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
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
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    }
  };

  const fetchSessionRequests = async () => {
    try {
      const data = await apiCall('/sessions/my-requests');
      setSessionRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to fetch requests', error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await apiCall('/sessions/stats');
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: activeTab === 'Dashboard', onClick: () => setActiveTab('Dashboard') },
    { icon: Calendar, label: 'My Sessions', active: activeTab === 'My Sessions', onClick: () => setActiveTab('My Sessions') },
    { icon: QrCode, label: 'Scan Attendance', active: activeTab === 'Scan Attendance', onClick: () => setActiveTab('Scan Attendance') },
    { icon: Code, label: 'Launch Code', active: activeTab === 'Launch Code', onClick: () => setActiveTab('Launch Code') },
    { icon: Star, label: 'Reviews Received', active: activeTab === 'Reviews Received', onClick: () => setActiveTab('Reviews Received') },
    { icon: HelpCircle, label: 'Help Center' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F4F4F9] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        <Sidebar
          logo={logo}
          logoClassName="w-56 h-auto"
          items={sidebarItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        >
          <div className="bg-gradient-to-br from-[#C9C7F5] to-[#A9C1F7] rounded-2xl p-6 text-white relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-bl-full" />
            <h3 className="font-bold text-lg mb-2 text-gray-800">Upgrade to Gold</h3>
            <p className="text-sm text-gray-700 mb-4">Get access to premium features and analytics.</p>
            <button className="bg-white text-[#5a59b5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors w-full shadow-sm">
              Upgrade Now
            </button>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-y-auto">
          <Header user={user} title={`Hello, ${user.name || 'Mentor'}!`} searchPlaceholder="Search sessions, learners..." />

          <div className="p-8">
            {activeTab === 'Dashboard' ? (
              <MentorDashboardView
                stats={stats}
                mySessions={mySessions}
                sessionRequests={sessionRequests}
                reviewStats={reviewStats}
                setActiveTab={setActiveTab}
                loading={loading}
              />
            ) : activeTab === 'Launch Code' ? (
              <LaunchCodingQuestion setActiveTab={setActiveTab} mySessions={mySessions} />
            ) : activeTab === 'My Sessions' ? (
              loading ? <MentorSessionsSkeleton /> : <MySessions sessions={[
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
            ) : activeTab === 'Reviews Received' ? (
              loading ? <ReviewsSkeleton /> : <ReviewsReceived />
            ) : activeTab === 'Scan Attendance' ? (
              <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[2rem] shadow-sm border border-gray-100 h-[600px] animate-in fade-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <QrCode className="w-12 h-12 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Ticket Scanner</h2>
                <p className="text-gray-500 mb-8 max-w-sm text-center text-lg">
                  Use your camera to scan student QR codes for instant attendance verification.
                </p>
                <button
                  onClick={() => setShowScanner(true)}
                  className="bg-black text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all hover:shadow-xl hover:-translate-y-1"
                >
                  Open Scanner
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Coming Soon</h3>
                <p>This feature is currently under development.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}

      {/* Mobile Scan FAB */}
      <button
        onClick={() => setShowScanner(true)}
        className="md:hidden fixed bottom-6 right-6 z-50 bg-black text-white p-4 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform border border-white/20"
      >
        <QrCode className="w-6 h-6" />
      </button>
    </div>
  );
}
