import React, { useState, useEffect } from 'react';
import { Monitor, Keyboard, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DesktopOnlyGuard({ children }) {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 900);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isMobile) {
        return (
            <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#F8F9FC] dark:bg-gray-950 p-6 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/40 dark:bg-indigo-500/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-200/40 dark:bg-purple-500/10 blur-[120px]" />

                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 dark:border-white/10">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/15 dark:to-purple-500/15 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-black/5 dark:ring-white/10">
                            <Monitor className="text-indigo-600 dark:text-indigo-400" size={32} />
                        </div>

                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 tracking-tight">
                                Coding Playground
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed max-w-[90%] mx-auto">
                                The coding challenge is designed for a rich, immersive experience and works best on a larger screen.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8 bg-gray-50/50 dark:bg-gray-800/40 p-6 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-2 mb-4">
                                <Keyboard size={14} className="text-amber-500" />
                                Why Desktop?
                            </h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 min-w-[1.25rem] h-5 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
                                        <CheckCircle size={10} className="text-green-600 dark:text-green-400" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Full keyboard for fast, comfortable coding</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 min-w-[1.25rem] h-5 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
                                        <CheckCircle size={10} className="text-green-600 dark:text-green-400" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Side-by-side problem and code editor</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-0.5 min-w-[1.25rem] h-5 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
                                        <CheckCircle size={10} className="text-green-600 dark:text-green-400" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Resizable panels and test case console</span>
                                </li>
                            </ul>
                        </div>

                        <div className="text-center space-y-4">
                            <p className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                                Please switch to a larger device
                            </p>

                            <button
                                onClick={() => navigate(-1)}
                                className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
                            >
                                <ArrowLeft size={20} />
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return children;
}
