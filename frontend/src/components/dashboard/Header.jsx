import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOptimizedImageUrl } from '../../utils/cloudinary';

export default function Header({ user, title, searchPlaceholder = "Search..." }) {
    const navigate = useNavigate();

    return (
        // Near-opaque bg instead of backdrop-blur: blurring the content scrolling
        // under a sticky header forces a repaint every frame and causes scroll lag.
        <header className="px-8 py-6 flex items-center justify-between sticky top-0 z-50 bg-[#F5F6FA]/95">
            <h2 className="text-3xl font-light text-gray-800 tracking-tight">{title}</h2>

            <div className="flex items-center gap-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="pl-11 pr-6 py-2.5 bg-white border-none shadow-sm rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black/5 w-64 md:w-80 transition-all hover:shadow-md"
                    />
                </div>

                <button className="relative p-2 hover:bg-white hover:shadow-sm rounded-full transition-all duration-300 group">
                    <Bell className="w-6 h-6 text-gray-600 group-hover:text-gray-900" strokeWidth={1.5} />
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-orange-400 rounded-full ring-2 ring-[#F5F6FA]" />
                </button>

                <button
                    onClick={() => navigate('/profile')}
                    className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden hover:ring-4 hover:ring-white hover:shadow-lg transition-all duration-300"
                >
                    {user.profilePicture ? (
                        <img
                            src={getOptimizedImageUrl(user.profilePicture, { width: 80, height: 80 })}
                            width={40}
                            height={40}
                            fetchPriority="high"
                            alt={user.name || "User profile picture"}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-medium">
                            {(user.name || 'U')[0]}
                        </div>
                    )}
                </button>
            </div>
        </header>
    );
}
