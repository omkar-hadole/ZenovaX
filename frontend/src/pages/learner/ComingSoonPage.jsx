import React from 'react';
import { Settings, FileText, HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function ComingSoonPage() {
    const location = useLocation();

    const getPageInfo = () => {
        const path = location.pathname;
        if (path.includes('resources')) return { title: 'Resources', icon: FileText };
        if (path.includes('help')) return { title: 'Help Center', icon: HelpCircle };
        if (path.includes('settings')) return { title: 'Settings', icon: Settings };
        return { title: 'Coming Soon', icon: Settings };
    };

    const { title, icon: Icon } = getPageInfo();

    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-gray-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Icon className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-500">This feature is currently under development.</p>
            <p className="text-sm text-gray-400 mt-2">Check back soon!</p>
        </div>
    );
}
