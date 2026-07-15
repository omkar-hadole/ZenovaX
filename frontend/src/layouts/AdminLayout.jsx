import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Clock,
    BookOpen,
    Users,
    Flag,
    Settings,
    Wallet,
} from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';
import logoLight from '../assets/adminlogo.svg';
import logoDark from '../assets/adminlogo-dark.svg';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AdminLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme } = useTheme();
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
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Clock, label: 'Pending Sessions', path: '/admin/pending-sessions' },
        { icon: BookOpen, label: 'All Sessions', path: '/admin/all-sessions' },
        { icon: Users, label: 'All Users', path: '/admin/users' },
        { icon: Wallet, label: 'Payments', path: '/admin/payments' },
        { icon: Flag, label: 'Reports / Flagged', path: '/admin/reports' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <ErrorBoundary>
            <div className="flex h-screen bg-[#F5F6FA] dark:bg-gray-950 font-outfit">
                <Sidebar
                    logo={theme === 'dark' ? logoDark : logoLight}
                    logoClassName="w-56 h-auto"
                    items={sidebarItems}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onLogout={handleLogout}
                />

                <main className="flex-1 overflow-y-auto">
                    <Header user={user || {}} title="Admin Dashboard" searchPlaceholder="Search admin..." />
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </ErrorBoundary>
    );
}
