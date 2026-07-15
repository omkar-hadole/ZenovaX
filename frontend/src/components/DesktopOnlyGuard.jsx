import React, { useState, useEffect } from 'react';
import { Monitor, Layout, CheckCircle, Sparkles, QrCode } from 'lucide-react';
import QRScanner from './dashboard/mentor/QRScanner';
import { useAuth } from '../context/AuthContext';

export default function DesktopOnlyGuard({ children }) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
    const [showScanner, setShowScanner] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 900);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isMobile) {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#F8F9FC] dark:bg-gray-950 p-6 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/30 dark:bg-purple-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/30 dark:bg-blue-500/10 blur-[120px]" />

                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-white/10">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/15 dark:to-purple-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                            <Monitor className="text-indigo-600 dark:text-indigo-400" size={32} />
                        </div>

                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
                                Hey learner! <span className="inline-block animate-wave">👋</span>
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-[90%] mx-auto">
                                ZenovaX is designed for a rich, immersive experience that works best on larger screens.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8 bg-gray-50/50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <Sparkles size={14} className="text-amber-500 fill-amber-500" />
                                Why Desktop?
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 min-w-[1.25rem] h-5 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
                                        <CheckCircle size={10} className="text-green-600 dark:text-green-400" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Immersive session booking experience</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 min-w-[1.25rem] h-5 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
                                        <CheckCircle size={10} className="text-green-600 dark:text-green-400" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Clear view of complex resources</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 min-w-[1.25rem] h-5 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
                                        <CheckCircle size={10} className="text-green-600 dark:text-green-400" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Detailed mentor comparisons</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 min-w-[1.25rem] h-5 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
                                        <CheckCircle size={10} className="text-green-600 dark:text-green-400" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Seamless live collaboration</span>
                                </li>
                            </ul>
                        </div>

                        <div className="text-center space-y-4">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
                                Please switch to a larger device
                            </p>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                                <a
                                    href="https://wa.me/919876543210" // Replace with actual number
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300 transition"
                                >
                                    <span>Need help? Chat on WhatsApp</span>
                                </a>

                                {user?.role === 'MENTOR' && (
                                    <>
                                        <button
                                            onClick={() => setShowScanner(true)}
                                            className="w-full flex items-center justify-center gap-3 bg-black dark:bg-white text-white dark:text-gray-900 px-6 py-4 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg hover:shadow-xl active:scale-95"
                                        >
                                            <QrCode size={20} />
                                            Scan Ticket (Mentor)
                                        </button>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                            Open scanner to verify attendance
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}
            </div>
        );
    }

    return children;
}
