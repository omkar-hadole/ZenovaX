import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Star,
  HelpCircle,
  Settings,
} from 'lucide-react';

import { apiCall } from '../utils/api';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import MySessions from '../components/dashboard/mentor/MySessions';
import MentorDashboardView from '../components/dashboard/mentor/MentorDashboardView';
import ReviewsReceived from '../components/dashboard/mentor/ReviewsReceived';
import MentorSessionsSkeleton from '../components/dashboard/mentor/MentorSessionsSkeleton';
import ReviewsSkeleton from '../components/dashboard/mentor/ReviewsSkeleton';

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
    { icon: Star, label: 'Reviews Received', active: activeTab === 'Reviews Received', onClick: () => setActiveTab('Reviews Received') },
    { icon: HelpCircle, label: 'Help Center' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F4F4F9] relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-200/30 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[100px]" />
      </div>

      <div className="relative z-10 flex h-full w-full">
        <Sidebar
          title="ZenovaX Mentor"
          subtitle="Mentor Dashboard"
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
            ) : activeTab === 'My Sessions' ? (
              loading ? <MentorSessionsSkeleton /> : <MySessions sessions={mySessions} />
            ) : activeTab === 'Reviews Received' ? (
              loading ? <ReviewsSkeleton /> : <ReviewsReceived />
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
    </div>
  );
}
