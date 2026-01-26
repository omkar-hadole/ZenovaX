import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';

export default function Sidebar({ title, subtitle, items, activeTab, setActiveTab, onLogout, children, logo, logoClassName = "h-8 object-contain" }) {
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        onLogout();
    };

    return (
        <>
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
                    onClick={handleLogoutClick}
                    className="mx-6 mb-8 flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 hover:translate-x-1"
                >
                    <LogOut className="w-5 h-5" strokeWidth={1.5} />
                    Logout
                </button>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                <LogOut className="w-8 h-8 text-red-500" strokeWidth={1.5} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Sign Out?
                            </h3>
                            <p className="text-gray-500 text-sm mb-8 px-4">
                                Are you sure you want to sign out? You will need to login again to access your account.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="flex-1 px-4 py-3 rounded-xl bg-red-400 text-white font-medium hover:bg-red-500 shadow-lg shadow-red-200 transition-all hover:shadow-xl"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
