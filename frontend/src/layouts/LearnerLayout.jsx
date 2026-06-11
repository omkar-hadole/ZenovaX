import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    FileText,
    HelpCircle,
    Settings,
    Users,
} from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import logo from '../assets/logo.svg';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

export default function LearnerLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('Dashboard');

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Logout error:', err);
        }
        navigate('/auth');
    };

    const sidebarItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: BookOpen, label: 'Browse Sessions', path: '/sessions' },
        { icon: Calendar, label: 'My Bookings', path: '/bookings' },
        { icon: Users, label: 'Mentors', path: '/mentors' },
        { icon: HelpCircle, label: 'Help Center', path: '/help' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <ErrorBoundary>
            <div className="flex h-screen bg-[#F5F6FA] font-outfit">
                <Sidebar
                    logo={logo}
                    items={sidebarItems}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onLogout={handleLogout}
                >
                    <div className="bg-[#1C1C1E] rounded-[2rem] p-6 text-white relative overflow-hidden text-center mx-2 mb-4">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 text-black shadow-lg transform -rotate-12">
                            <HelpCircle className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Zen</h3>
                        <p className="text-gray-400 text-xs mb-4 leading-relaxed">Your AI learning assistant. Ask me anything!</p>
                        <button
                            onClick={() => navigate('/zen')}
                            className="bg-[#F6D483] text-black px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#FFE5A5] transition-all w-full shadow-lg shadow-orange-900/20"
                        >
                            Chat with Zen
                        </button>
                    </div>
                </Sidebar>

                <main className="flex-1 overflow-y-auto">
                    <Header user={user || {}} title={`Welcome back ${user?.name || 'Learner'}`} searchPlaceholder="Search courses" />
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </ErrorBoundary>
    );
}
