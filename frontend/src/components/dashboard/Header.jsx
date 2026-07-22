import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, BookOpen, User as UserIcon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiCall } from '../../utils/api';
import { getOptimizedImageUrl } from '../../utils/cloudinary';
import NotificationBell from './NotificationBell';
import ThemeToggle from '../ThemeToggle';

export default function Header({ user, title, searchPlaceholder = "Search..." }) {
    const navigate = useNavigate();
    const location = useLocation();
    const searchRef = useRef(null);

    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [mentorResults, setMentorResults] = useState([]);
    const [sessionResults, setSessionResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const runSearch = useCallback(async (term) => {
        setIsLoading(true);
        try {
            const [mentorRes, sessionRes] = await Promise.all([
                apiCall(`/profile/mentors?limit=50`),
                apiCall(`/sessions/all?search=${encodeURIComponent(term)}&limit=4`)
            ]);

            const lowerTerm = term.toLowerCase();
            const matchedMentors = (mentorRes.mentors || [])
                .filter((mentor) =>
                    mentor.name?.toLowerCase().includes(lowerTerm) ||
                    mentor.department?.toLowerCase().includes(lowerTerm)
                )
                .slice(0, 4);

            setMentorResults(matchedMentors);
            setSessionResults(sessionRes.sessions || []);
        } catch (error) {
            console.error("Header search failed", error);
            setMentorResults([]);
            setSessionResults([]);
        } finally {
            setIsLoading(false);
            setHasSearched(true);
        }
    }, []);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 2) {
            setIsOpen(false);
            setHasSearched(false);
            setMentorResults([]);
            setSessionResults([]);
            return undefined;
        }

        setIsOpen(true);
        const timeout = setTimeout(() => runSearch(trimmed), 350);
        return () => clearTimeout(timeout);
    }, [query, runSearch]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setIsOpen(false);
        setQuery('');
    }, [location.pathname]);

    const handleSelectMentor = (mentorId) => {
        setIsOpen(false);
        setQuery('');
        navigate(`/profile/${mentorId}`);
    };

    const handleSelectSession = (sessionId) => {
        setIsOpen(false);
        setQuery('');
        navigate(`/sessions/${sessionId}`);
    };

    const noResults = hasSearched && !isLoading && mentorResults.length === 0 && sessionResults.length === 0;

    return (
        // Near-opaque bg instead of backdrop-blur: blurring the content scrolling
        // under a sticky header forces a repaint every frame and causes scroll lag.
        <header className="px-8 py-6 flex items-center justify-between sticky top-0 z-50 bg-[#F5F6FA]/95 dark:bg-gray-950/95">
            <h2 className="text-3xl font-light text-gray-800 dark:text-gray-100 tracking-tight">{title}</h2>

            <div className="flex items-center gap-6">
                <div className="relative group" ref={searchRef}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-600 dark:group-focus-within:text-gray-300 transition-colors" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => { if (query.trim().length >= 2) setIsOpen(true); }}
                        placeholder={searchPlaceholder}
                        className="pl-11 pr-6 py-2.5 bg-white dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500 border-none shadow-sm rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 w-64 md:w-80 transition-all hover:shadow-md"
                    />

                    {isOpen && (
                        <div className="absolute top-full mt-2 left-0 w-full min-w-[22rem] bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                                </div>
                            ) : noResults ? (
                                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No results for "{query.trim()}"
                                </div>
                            ) : (
                                <div className="max-h-96 overflow-y-auto py-2">
                                    {mentorResults.length > 0 && (
                                        <div className="mb-2">
                                            <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Mentors</p>
                                            {mentorResults.map((mentor) => (
                                                <button
                                                    key={mentor.id}
                                                    onClick={() => handleSelectMentor(mentor.id)}
                                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                                        {mentor.profilePicture ? (
                                                            <img
                                                                src={getOptimizedImageUrl(mentor.profilePicture, { width: 64, height: 64 })}
                                                                width={32}
                                                                height={32}
                                                                loading="lazy"
                                                                alt={mentor.name || "Mentor avatar"}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <UserIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{mentor.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{mentor.department || 'Mentor'}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {sessionResults.length > 0 && (
                                        <div>
                                            <p className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Sessions</p>
                                            {sessionResults.map((session) => (
                                                <button
                                                    key={session.id}
                                                    onClick={() => handleSelectSession(session.id)}
                                                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                                        <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{session.title}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.mentor?.name || 'Mentor'}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <ThemeToggle />

                <NotificationBell />

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
