import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';

export default function Sidebar({ title, subtitle, items, activeTab, setActiveTab, onLogout, children, logo, logoClassName = "h-8 object-contain" }) {
    const navigate = useNavigate();

    return (
        <aside className="w-64 bg-white/70 backdrop-blur-md border-r border-black/5 flex flex-col h-full shadow-sm transition-all duration-300">
            <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {logo ? (
                        <img src={logo} alt="Logo" className={logoClassName} />
                    ) : (
                        <span className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white text-lg">Z</span>
                    )}
                    {title}
                </h1>
                {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>

            <nav className="flex-1 px-6 space-y-2">
                {items.map((item, index) => {
                    if (item.path) {
                        return (
                            <NavLink
                                key={index}
                                to={item.path}
                                onClick={item.onClick}
                                className={({ isActive }) => `w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 group ${isActive
                                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 scale-[1.02]'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm hover:translate-x-1'
                                    }`}
                            >
                                {({ isActive }) => (
                                    <>
                                        <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} strokeWidth={1.5} />
                                        {item.label}
                                        {(item.label === 'Notifications' && item.badge) && (
                                            <span className="ml-auto bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                                {item.badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    } else {
                        return (
                            <button
                                key={index}
                                onClick={item.onClick}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 group ${item.active
                                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 scale-[1.02]'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm hover:translate-x-1'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-colors ${item.active ? 'text-white' : 'text-gray-400 group-hover:text-gray-900'}`} strokeWidth={1.5} />
                                {item.label}
                                {(item.label === 'Notifications' && item.badge) && (
                                    <span className="ml-auto bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    }
                })}
            </nav>

            <div className="p-6">
                {children}
            </div>

            <button
                onClick={onLogout}
                className="mx-6 mb-8 flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 hover:translate-x-1"
            >
                <LogOut className="w-5 h-5" strokeWidth={1.5} />
                Logout
            </button>
        </aside>
    );
}
