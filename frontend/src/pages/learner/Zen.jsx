import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles, Link2, CheckCircle2, LogOut } from 'lucide-react';
import { useSignInWithChatGPT, openaiAuthHeaders } from '@openai-oauth/react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, "").replace(/\/api$/, "");
const API_ENDPOINT = `${BASE_URL}/api/help/ask-ai`;
const CHATGPT_ENDPOINT = `${BASE_URL}/api/help/ask-ai-chatgpt`;
const BRAND_COLOR = '#7A79E6'; // ZenovaX Brand Color
const PROVIDER_STORAGE_KEY = 'zen-ai-provider';

const AnimatedOrb = ({ isTyping, isThinking, isDark }) => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const baseRadius = 40;

        if (particlesRef.current.length === 0) {
            for (let i = 0; i < 50; i++) {
                const angle = (Math.PI * 2 * i) / 50;
                particlesRef.current.push({
                    angle,
                    radius: baseRadius + Math.random() * 10,
                    speed: 0.01 + Math.random() * 0.02,
                    size: 1 + Math.random() * 2,
                    opacity: 0.3 + Math.random() * 0.7,
                    offset: Math.random() * Math.PI * 2,
                });
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Orb gradient — adapts to theme
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius + 40);
            if (isDark) {
                // Dark mode: richer, more saturated colors fading to transparent black
                gradient.addColorStop(0, 'rgba(140, 130, 255, 0.95)');
                gradient.addColorStop(0.35, 'rgba(100, 80, 230, 0.55)');
                gradient.addColorStop(0.7, 'rgba(80, 60, 200, 0.15)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            } else {
                // Light mode: original soft pastel gradient
                gradient.addColorStop(0, 'rgba(180, 190, 255, 0.9)');
                gradient.addColorStop(0.4, 'rgba(122, 121, 230, 0.5)');
                gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0)');
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((particle, i) => {
                particle.angle += particle.speed;

                let radiusModifier = 0;
                if (isThinking) {
                    radiusModifier = Math.sin(Date.now() / 200 + particle.offset) * 8;
                } else if (isTyping) {
                    radiusModifier = Math.sin(Date.now() / 300 + particle.offset) * 4;
                }

                const x = centerX + Math.cos(particle.angle) * (particle.radius + radiusModifier);
                const y = centerY + Math.sin(particle.angle) * (particle.radius + radiusModifier);

                ctx.beginPath();
                ctx.arc(x, y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = isDark
                    ? `rgba(160, 150, 255, ${particle.opacity})`
                    : `rgba(122, 121, 230, ${particle.opacity})`;
                ctx.fill();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isTyping, isThinking, isDark]);

    return <canvas ref={canvasRef} width={200} height={200} className="mx-auto" />;
};

const Zen = () => {
    const [chat, setChat] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [provider, setProviderState] = useState(() => localStorage.getItem(PROVIDER_STORAGE_KEY) || 'gemini');
    const [showQuotaSuggestion, setShowQuotaSuggestion] = useState(false);
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const bottomRef = useRef(null);

    const setProvider = (next) => {
        setProviderState(next);
        localStorage.setItem(PROVIDER_STORAGE_KEY, next);
    };

    // Optional per-user fallback: each student connects their OWN ChatGPT
    // account (never a shared/pooled credential — see helpService.js for
    // why). No custom redirectUri here on purpose: OpenAI only accepts a
    // small set of pre-approved redirect URIs for this client_id, which ours
    // isn't on — the supported path for third-party sites is the "Sign in
    // with ChatGPT" browser extension bridging the login back to this page.
    const {
        status: chatGptStatus,
        installUrl: chatGptInstallUrl,
        isSignedIn: chatGptConnected,
        login: connectChatGPT,
        logout: disconnectChatGPT,
    } = useSignInWithChatGPT({
        onSuccess: () => {
            setProvider('chatgpt');
            setShowQuotaSuggestion(false);
        },
    });
    const needsChatGptExtension = chatGptStatus === 'needs-extension';

    // Auto-scroll to the latest message/typing indicator, same as
    // ChatGPT/Gemini, instead of leaving the user stuck wherever they were.
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [chat, loading]);


    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const send = async (e) => {
        e.preventDefault();
        const q = input.trim();
        if (!q || loading) return;

        setInput('');
        setIsTyping(false);
        setLoading(true);
        setShowQuotaSuggestion(false);
        setChat(prev => [...prev, { role: 'user', text: q }]);

        const username = user?.name || user?.firstName || "Creator";
        // `provider` is a persisted preference, but the ChatGPT session it
        // refers to may have expired since — fall back to Gemini rather than
        // send a request that's guaranteed to fail.
        const useChatGPT = provider === 'chatgpt' && chatGptConnected;

        try {
            const { data } = useChatGPT
                ? await axios.post(CHATGPT_ENDPOINT, { question: q, username }, { headers: await openaiAuthHeaders() })
                : await axios.post(API_ENDPOINT, { question: q, username });

            setChat(prev => [...prev, { role: 'assistant', text: data.answer }]);
            if (data.quotaExceeded && !chatGptConnected) {
                setShowQuotaSuggestion(true);
            }
        } catch {
            setChat(prev => [...prev, { role: 'assistant', text: "Service unavailable. Please contact support." }]);
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        setIsTyping(e.target.value.length > 0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(e);
        }
    };

    return (

        <div className="h-[calc(100vh-6rem)] bg-white dark:bg-gray-950 flex flex-col relative font-outfit overflow-hidden">
            {/* Soft Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-100/40 dark:bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-100/40 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>

            {/* Main Scrollable Area */}
            <div className="flex-1 w-full overflow-y-auto relative z-10 flex flex-col items-center custom-scrollbar">
                <div className="w-full max-w-[900px] flex flex-col items-center my-auto p-4 pb-4">

                    {/* Header Section */}
                    <div className="text-center w-full mb-8">
                        {/* Orb */}
                        <div className="flex justify-center mb-6 scale-125">
                            <AnimatedOrb isTyping={isTyping} isThinking={loading} isDark={isDark} />
                        </div>

                        {/* Greeting */}
                        {chat.length === 0 && (
                            <div className="space-y-2">
                                <h1 className="text-[2.5rem] font-semibold text-[#1F1F1F] dark:text-gray-100 tracking-[-0.02em]">
                                    {getGreeting()}, {user?.name || 'Judha'}
                                </h1>
                                <h2 className="text-[2.5rem] font-semibold text-[#1F1F1F] dark:text-gray-100 tracking-[-0.02em]">
                                    How Can I <span style={{ color: BRAND_COLOR }} className="">Assist You Today?</span>
                                </h2>
                            </div>
                        )}
                    </div>

                    {/* Chat Output Area */}
                    {chat.length > 0 && (
                        <div className="w-full max-w-[850px] space-y-4 mb-4 px-4">
                            {chat.map((m, i) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed ${m.role === 'user'
                                        ? 'text-white rounded-tr-sm shadow-md shadow-indigo-500/10'
                                        : 'bg-white/80 dark:bg-gray-800/80 border border-slate-100 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-tl-sm shadow-sm'
                                        }`}
                                        style={{ backgroundColor: m.role === 'user' ? BRAND_COLOR : undefined }}
                                    >
                                        <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert' : ''}`}>
                                            {/* XSS Safety: ReactMarkdown does not use dangerouslySetInnerHTML by default.
                                                Raw HTML tags in AI-generated markdown are stripped because rehype-raw
                                                is not installed. If rehype-raw is ever added, wrap m.text with
                                                sanitizeHTML() from src/utils/sanitize.js before passing it here. */}
                                            <ReactMarkdown>{m.text}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="px-4">
                                    <div className="text-sm text-slate-400 dark:text-gray-500 font-medium flex items-center gap-2">
                                        Zen is thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>
            </div>

            {/* Input Footer - Stays at bottom */}
            <div className="w-full flex justify-center p-6 pt-2 z-50 bg-white/0">
                <div className="w-full max-w-[850px]">

                    {/* Optional ChatGPT fallback suggestion — shown when Gemini's free quota is exhausted */}
                    {showQuotaSuggestion && (
                        <div className="mb-3 px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between gap-3 text-sm">
                            <span className="text-indigo-700 dark:text-indigo-300">
                                Gemini's free quota is exhausted right now. Connect your own ChatGPT account to keep chatting.
                            </span>
                            {needsChatGptExtension ? (
                                <button
                                    onClick={() => window.open(chatGptInstallUrl, '_blank', 'noopener,noreferrer')}
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                                >
                                    <Link2 className="w-3.5 h-3.5" /> Install extension
                                </button>
                            ) : (
                                <button
                                    onClick={connectChatGPT}
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                                >
                                    <Link2 className="w-3.5 h-3.5" /> Connect ChatGPT
                                </button>
                            )}
                        </div>
                    )}

                    {/* AI provider selector — Gemini is the default shared assistant; connecting a
                        personal ChatGPT account is entirely optional and per-user (never pooled). */}
                    <div className="mb-2 flex items-center gap-2 px-1">
                        <button
                            onClick={() => setProvider('gemini')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${provider === 'gemini' || !chatGptConnected
                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
                                }`}
                        >
                            Zen (default)
                        </button>
                        {chatGptConnected ? (
                            <>
                                <button
                                    onClick={() => setProvider('chatgpt')}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${provider === 'chatgpt'
                                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                        : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <CheckCircle2 className="w-3 h-3" /> Your ChatGPT
                                </button>
                                <button
                                    onClick={disconnectChatGPT}
                                    title="Disconnect ChatGPT"
                                    className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full text-xs text-slate-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                                >
                                    <LogOut className="w-3 h-3" /> Disconnect
                                </button>
                            </>
                        ) : needsChatGptExtension ? (
                            <>
                                <button
                                    onClick={() => window.open(chatGptInstallUrl, '_blank', 'noopener,noreferrer')}
                                    className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                                >
                                    <Link2 className="w-3 h-3" /> Install the ChatGPT extension
                                </button>
                                <button
                                    onClick={connectChatGPT}
                                    className="text-xs text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 underline underline-offset-2"
                                >
                                    Installed it? Try again
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={connectChatGPT}
                                className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-slate-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            >
                                <Link2 className="w-3 h-3" /> Connect your ChatGPT (optional)
                            </button>
                        )}
                    </div>

                    <div className="w-full bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] rounded-[22px] p-2 relative flex items-end gap-2 transition-all focus-within:shadow-[0_20px_60px_-15px_rgba(122,121,230,0.15)] focus-within:border-[#7A79E6]/30">

                        {/* Sparkles Icon */}
                        <div className="pb-2 pl-1.5">
                            <Sparkles className="w-5 h-5 opacity-60" style={{ color: BRAND_COLOR }} />
                        </div>

                        {/* Textarea */}
                        <textarea
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Initiate a query or send a command to the AI..."
                            className="w-full bg-transparent text-[15px] text-slate-700 dark:text-gray-300 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none resize-none py-2 max-h-[100px] overflow-y-auto leading-relaxed"
                            style={{ height: '40px' }}
                            spellCheck={false}
                        />

                        {/* Send Button */}
                        <button
                            onClick={send}
                            disabled={!input.trim() || loading}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed mb-0.5 flex-shrink-0`}
                            style={{
                                background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, #908FE8 100%)`,
                                boxShadow: 'none'
                            }}
                        >
                            <Send size={17} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Zen;
