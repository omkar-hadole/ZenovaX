import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Star,
    HelpCircle,
    Settings,
    QrCode,
    Code,
    AlertTriangle
} from 'lucide-react';
import Sidebar from '../../dashboard/Sidebar';
import logo from '../../../assets/mentorlogo.svg';
import { useAuth } from '../../../context/AuthContext';

export default function MentorSidebar({ activeTab, onTabChange }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const handleNavigation = (tabName) => {
        if (onTabChange) {
            onTabChange(tabName);
        } else {
            // Navigate to dashboard with tab query param
            navigate(`/mentor-dashboard?tab=${encodeURIComponent(tabName)}`);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Logout error:', err);
        }
        localStorage.removeItem('token');
        navigate('/');
    };

    const items = [
        {
            icon: LayoutDashboard,
            label: 'Dashboard',
            active: activeTab === 'Dashboard',
            onClick: () => handleNavigation('Dashboard')
        },
        {
            icon: Calendar,
            label: 'My Sessions',
            active: activeTab === 'My Sessions',
            onClick: () => handleNavigation('My Sessions')
        },
        {
            icon: AlertTriangle,
            label: 'Reports',
            active: activeTab === 'Reports',
            onClick: () => handleNavigation('Reports')
        },
        {
            icon: QrCode,
            label: 'Scan Attendance',
            active: activeTab === 'Scan Attendance',
            onClick: () => handleNavigation('Scan Attendance')
        },

        {
            icon: Star,
            label: 'Reviews Received',
            active: activeTab === 'Reviews Received',
            onClick: () => handleNavigation('Reviews Received')
        },
        {
            icon: HelpCircle,
            label: 'Help Center',
            active: activeTab === 'Help Center',
            onClick: () => handleNavigation('Help Center') // Or implement help page
        },
        {
            icon: Settings,
            label: 'Settings',
            active: activeTab === 'Settings',
            onClick: () => handleNavigation('Settings') // Or implement settings page
        },
    ];

    return (
        <Sidebar
            logo={logo}
            logoClassName="w-56 h-auto"
            items={items}
            activeTab={activeTab}
            setActiveTab={onTabChange}
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
    );
}
