import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Star,
    HelpCircle,
    Settings,
    QrCode,
    AlertTriangle,
    Wallet
} from 'lucide-react';
import Sidebar from '../../dashboard/Sidebar';
import logo from '../../../assets/mentorlogo.svg';
import { useAuth } from '../../../context/AuthContext';

const TAB_PATHS = {
    'Dashboard': '/mentor/dashboard',
    'My Sessions': '/mentor/sessions',
    'Reports': '/mentor/reports',
    'Scan Attendance': '/mentor/scan-attendance',
    'Reviews Received': '/mentor/reviews',
    'Earnings': '/mentor/earnings',
    'Help Center': '/mentor/help',
    'Settings': '/mentor/settings',
};

const BASE_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Calendar, label: 'My Sessions' },
    { icon: AlertTriangle, label: 'Reports' },
    { icon: QrCode, label: 'Scan Attendance' },
    { icon: Star, label: 'Reviews Received' },
    { icon: Wallet, label: 'Earnings' },
    { icon: HelpCircle, label: 'Help Center' },
    { icon: Settings, label: 'Settings' },
];

// activeTab is only needed on pages rendered *outside* the nested /mentor
// layout (e.g. session details, create session) where there's no matching
// route for NavLink to auto-highlight. When omitted (the normal case, inside
// MentorLayout), items use real paths and NavLink handles active state itself.
export default function MentorSidebar({ activeTab }) {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error('Logout error:', err);
        }
        navigate('/auth');
    };

    const items = activeTab
        ? BASE_ITEMS.map((item) => ({
            ...item,
            active: item.label === activeTab,
            onClick: () => navigate(TAB_PATHS[item.label]),
        }))
        : BASE_ITEMS.map((item) => ({ ...item, path: TAB_PATHS[item.label] }));

    return (
        <Sidebar
            logo={logo}
            logoClassName="w-56 h-auto"
            items={items}
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
