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
import EarningsTeaserCard from './EarningsTeaserCard';
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
    const { logout, user } = useAuth();

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
            <EarningsTeaserCard totalSessions={user?.totalSessions} />
        </Sidebar>
    );
}
