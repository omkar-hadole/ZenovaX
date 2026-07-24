import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { useSignInWithChatGPT, openaiAuthHeaders } from '@openai-oauth/react';
import {
    Sparkles,
    Search,
    Command,
    X,
    Send,
    Calendar,
    Users,
    BookOpen,
    HelpCircle,
    ArrowRight,
    CornerDownLeft,
    Copy,
    Check,
    ExternalLink,
    MessageSquare,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCsrfToken } from '../utils/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, "").replace(/\/api$/, "");
const API_ENDPOINT = `${BASE_URL}/api/help/ask-ai`;
const CHATGPT_ENDPOINT = `${BASE_URL}/api/help/ask-ai-chatgpt`;
const BRAND_COLOR = '#7A79E6';
const PROVIDER_STORAGE_KEY = 'zen-ai-provider';

const QUICK_ACTIONS = [
    {
        id: 'next-session',
        icon: Calendar,
        label: 'When is my next session?',
        category: 'AI Assistant',
        prompt: 'When is my next session?',
    },
    {
        id: 'recommend-mentor',
        icon: Users,
        label: 'Recommend a mentor for Fullstack MERN',
        category: 'AI Assistant',
        prompt: 'Recommend a mentor for Fullstack MERN development',
    },
    {
        id: 'refund-policy',
        icon: HelpCircle,
        label: 'What is the refund & cancellation policy?',
        category: 'AI Assistant',
        prompt: 'What is the refund and cancellation policy for sessions?',
    },
    {
        id: 'nav-bookings',
        icon: BookOpen,
        label: 'Go to My Bookings',
        category: 'Navigation',
        path: '/bookings',
    },
    {
        id: 'nav-mentors',
        icon: Users,
        label: 'Browse Mentors',
        category: 'Navigation',
        path: '/mentors',
    },
    {
        id: 'nav-zen',
        icon: MessageSquare,
        label: 'Open Full Zen AI Workspace',
        category: 'Navigation',
        path: '/zen',
    },
];

const MARKDOWN_COMPONENTS = {
    a: ({ node, children, href, ...props }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-0.5"
            {...props}
        >
            {children}
            <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-80" />
        </a>
    ),
    strong: ({ node, children, ...props }) => (
        <strong className="font-bold text-slate-900 dark:text-white" {...props}>
            {children}
        </strong>
    ),
    em: ({ node, children, ...props }) => (
        <em className="italic text-slate-800 dark:text-gray-200" {...props}>
            {children}
        </em>
    ),
    ul: ({ node, children, ...props }) => (
        <ul className="list-disc list-outside ml-4 my-1.5 space-y-0.5 text-slate-700 dark:text-gray-300 text-xs" {...props}>
            {children}
        </ul>
    ),
    ol: ({ node, children, ...props }) => (
        <ol className="list-decimal list-outside ml-4 my-1.5 space-y-0.5 text-slate-700 dark:text-gray-300 text-xs" {...props}>
            {children}
        </ol>
    ),
    li: ({ node, children, ...props }) => (
        <li className="leading-relaxed" {...props}>
            {children}
        </li>
    ),
    code({ node, inline, children, ...props }) {
        return (
            <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 font-mono text-[11px] border border-slate-200 dark:border-gray-700" {...props}>
                {children}
            </code>
        );
    }
};

export default function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [provider, setProviderState] = useState(() => localStorage.getItem(PROVIDER_STORAGE_KEY) || 'gemini');
    const inputRef = useRef(null);
    const modalRef = useRef(null);

    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme } = useTheme();

    const setProvider = (next) => {
        setProviderState(next);
        localStorage.setItem(PROVIDER_STORAGE_KEY, next);
    };

    const {
        isSignedIn: chatGptConnected,
        login: connectChatGPT
    } = useSignInWithChatGPT({
        onSuccess: () => {
            setProvider('chatgpt');
        }
    });

    // Toggle modal via keyboard shortcut (Cmd+K / Ctrl+K / Escape) or global custom event
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            } else if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                setIsOpen(false);
            }
        };

        const handleCustomOpen = () => setIsOpen(true);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('open-command-bar', handleCustomOpen);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('open-command-bar', handleCustomOpen);
        };
    }, [isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setQuery('');
            setAiResponse(null);
            setLoading(false);
        }
    }, [isOpen]);

    const handleAskAI = useCallback(async (questionText) => {
        const q = (questionText || query).trim();
        if (!q || loading) return;

        setLoading(true);
        setAiResponse(null);

        const username = user?.name || user?.firstName || "Learner";
        const csrfToken = getCsrfToken();
        const csrfHeaders = csrfToken ? { 'X-CSRF-Token': csrfToken } : {};

        const activeProvider = localStorage.getItem(PROVIDER_STORAGE_KEY) || 'gemini';
        const useChatGPT = activeProvider === 'chatgpt' && chatGptConnected;

        try {
            const { data } = useChatGPT
                ? await axios.post(
                    CHATGPT_ENDPOINT,
                    { question: q, username },
                    {
                        withCredentials: true,
                        headers: { ...(await openaiAuthHeaders()), ...csrfHeaders }
                    }
                )
                : await axios.post(
                    API_ENDPOINT,
                    { question: q, username },
                    { withCredentials: true, headers: csrfHeaders }
                );

            setAiResponse(data.answer);
        } catch {
            setAiResponse("Zen AI is currently unavailable. Please try again or open full chat in Zen.");
        } finally {
            setLoading(false);
        }
    }, [query, loading, user, chatGptConnected]);

    const handleSelectAction = (action) => {
        if (action.path) {
            setIsOpen(false);
            navigate(action.path);
        } else if (action.prompt) {
            setQuery(action.prompt);
            handleAskAI(action.prompt);
        }
    };

    const handleCopyResponse = async () => {
        if (!aiResponse) return;
        try {
            await navigator.clipboard.writeText(aiResponse);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    const filteredActions = QUICK_ACTIONS.filter((action) =>
        action.label.toLowerCase().includes(query.toLowerCase().trim())
    );

    if (!isOpen) return null;

    const useChatGPTActive = provider === 'chatgpt' && chatGptConnected;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 font-outfit">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

            {/* Modal Dialog */}
            <div
                ref={modalRef}
                className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-gray-800 overflow-hidden z-10 flex flex-col max-h-[80vh] transition-all animate-in zoom-in-95 duration-200"
            >
                {/* Search Bar Input */}
                <div className="p-4 border-b border-slate-100 dark:border-gray-800 flex items-center gap-3 bg-slate-50/50 dark:bg-gray-900/50">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Sparkles className="w-5 h-5 animate-pulse" style={{ color: BRAND_COLOR }} />
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAskAI();
                            }
                        }}
                        placeholder={useChatGPTActive ? "Ask with your ChatGPT... (Enter to submit)" : "Ask Zen AI or search actions... (Enter to submit)"}
                        className="flex-1 bg-transparent text-base text-slate-800 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none"
                    />

                    {loading ? (
                        <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                    ) : query.trim() ? (
                        <button
                            onClick={() => handleAskAI()}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#7A79E6] text-white text-xs font-semibold shadow-sm hover:bg-[#6867d6] transition-all"
                        >
                            <Send className="w-3.5 h-3.5" /> Ask Zen
                        </button>
                    ) : (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-gray-800 text-[11px] font-medium text-slate-400 dark:text-gray-500">
                            <span className="text-xs">ESC</span> to close
                        </div>
                    )}

                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* AI Provider Switcher Subbar */}
                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100/70 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 text-[11px]">
                    <span className="text-slate-400 dark:text-gray-500 font-medium">Model:</span>
                    <button
                        onClick={() => setProvider('gemini')}
                        className={`px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                            provider === 'gemini' || !chatGptConnected
                                ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold'
                                : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
                        }`}
                    >
                        Zen (Default)
                    </button>
                    {chatGptConnected ? (
                        <button
                            onClick={() => setProvider('chatgpt')}
                            className={`px-2.5 py-0.5 rounded-full font-medium transition-colors flex items-center gap-1 ${
                                provider === 'chatgpt'
                                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold'
                                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
                            }`}
                        >
                            <Check className="w-3 h-3 text-emerald-500" /> Your ChatGPT
                        </button>
                    ) : (
                        <button
                            onClick={connectChatGPT}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 ml-auto font-medium"
                        >
                            <ExternalLink className="w-3 h-3" /> Connect your ChatGPT
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {/* AI Response Output */}
                    {aiResponse && (
                        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3 animate-in fade-in duration-300">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {useChatGPTActive ? 'Your ChatGPT Response' : 'Zen AI Response'}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopyResponse}
                                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors"
                                    >
                                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsOpen(false);
                                            navigate('/zen');
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors"
                                    >
                                        Full Chat <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkBreaks]} components={MARKDOWN_COMPONENTS}>
                                    {aiResponse}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions & Navigation Suggestions */}
                    <div>
                        <p className="px-2 mb-2 text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">
                            Suggested Actions & Shortcuts
                        </p>
                        <div className="space-y-1">
                            {filteredActions.length > 0 ? (
                                filteredActions.map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => handleSelectAction(action)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {action.label}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 dark:text-gray-500">
                                                        {action.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <CornerDownLeft className="w-4 h-4 text-slate-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="py-6 text-center text-xs text-slate-400 dark:text-gray-500">
                                    Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 font-mono">Enter</kbd> to ask Zen AI "{query.trim()}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-gray-900/80 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-gray-500">
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-mono bg-slate-200/60 dark:bg-gray-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-gray-400">
                            <Command className="w-3 h-3" /> K
                        </span>
                        <span>Global Shortcut</span>
                    </div>

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            navigate('/zen');
                        }}
                        className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                    >
                        Go to Zen Workspace →
                    </button>
                </div>
            </div>
        </div>
    );
}
