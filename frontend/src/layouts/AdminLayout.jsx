import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Clock,
    BookOpen,
    Users,
    Flag,
    Settings,
} from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import Header from '../components/dashboard/Header';

export default function AdminLayout() {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    // activeTab is not strictly needed if we use paths, but Sidebar might use it for some logic or we can pass dummy
    const [activeTab, setActiveTab] = useState('Dashboard');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const sidebarItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Clock, label: 'Pending Sessions', path: '/admin/pending-sessions' },
        { icon: BookOpen, label: 'All Sessions', path: '/admin/all-sessions' },
        { icon: Users, label: 'All Users', path: '/admin/users' },
        { icon: Flag, label: 'Reports / Flagged', path: '/admin/reports' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <div className="flex h-screen bg-[#F5F6FA] font-outfit">
            <Sidebar
                title="ZenovaX Admin"
                subtitle="Administrator Panel"
                items={sidebarItems}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onLogout={handleLogout}
            />

            <main className="flex-1 overflow-y-auto">
                <Header user={user} title="Admin Dashboard" searchPlaceholder="Search admin..." />
                <Outlet />
            </main>
        </div>
    );
}
