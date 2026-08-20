import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    HelpCircle,
    Settings,
    QrCode,
    Code,
    TrendingUp,
} from 'lucide-react';
import Sidebar from '../../dashboard/Sidebar';
import EarningsTeaserCard from './EarningsTeaserCard';
import logoLight from '../../../assets/mentorlogo.svg';
import logoDark from '../../../assets/mentorlogo-dark.svg';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';

const TAB_PATHS = {
    'Dashboard': '/mentor/dashboard',
    'My Sessions': '/mentor/sessions',
    'Learner Demand': '/mentor/learning-requests',
    'Coding Questions': '/mentor/coding-questions',
    'Scan Attendance': '/mentor/scan-attendance',
    'Help Center': '/mentor/help',
    'Settings': '/mentor/settings',
};

const BASE_ITEMS = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Calendar, label: 'My Sessions' },
    { icon: TrendingUp, label: 'Learner Demand' },
    { icon: Code, label: 'Coding Questions' },
    { icon: QrCode, label: 'Scan Attendance' },
    { icon: HelpCircle, label: 'Help Center' },
    { icon: Settings, label: 'Settings' },
];

// activeTab is only needed on pages rendered *outside* the nested /mentor
// layout (e.g. session details, create session) where there's no matching
// route for NavLink to auto-highlight. When omitted (the normal case, inside
// MentorLayout), items use real paths and NavLink handles active state itself.
export default function MentorSidebar({ activeTab, open, onClose }) {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { theme } = useTheme();

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
            logo={theme === 'dark' ? logoDark : logoLight}
            logoClassName="w-56 h-auto"
            items={items}
            onLogout={handleLogout}
            open={open}
            onClose={onClose}
        >
            <EarningsTeaserCard />
        </Sidebar>
    );
}
