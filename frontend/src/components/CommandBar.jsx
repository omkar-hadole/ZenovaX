import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { useSignInWithChatGPT, openaiAuthHeaders } from '@openai-oauth/react';
import {
    Sparkles,
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
    Loader2,
    Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCsrfToken } from '../utils/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, "").replace(/\/api$/, "");
const API_ENDPOINT = `${BASE_URL}/api/help/ask-ai`;
const CHATGPT_ENDPOINT = `${BASE_URL}/api/help/ask-ai-chatgpt`;
const PROVIDER_STORAGE_KEY = 'zen-ai-provider';

const QUICK_ACTIONS = [
    { id: 'next-session',  icon: Calendar,     label: 'When is my next session?',                  prompt: 'When is my next session?' },
    { id: 'recommend',     icon: Users,         label: 'Recommend a mentor for Fullstack MERN',     prompt: 'Recommend top mentors for Fullstack MERN development' },
    { id: 'refund',        icon: HelpCircle,    label: 'What is the refund & cancellation policy?', prompt: 'What is the refund and cancellation policy for sessions?' },
    { id: 'nav-bookings',  icon: BookOpen,      label: 'Go to My Bookings',                         path: '/bookings' },
    { id: 'nav-mentors',   icon: Users,         label: 'Browse Mentors Directory',                  path: '/mentors' },
    { id: 'nav-zen',       icon: MessageSquare, label: 'Open Zen AI Workspace',                     path: '/zen' },
];

const MARKDOWN_COMPONENTS = {
    a: ({ node, children, href, ...props }) => (
        <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 font-medium underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5 transition-opacity"
            {...props}
        >
            {children}<ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
        </a>
    ),
    strong: ({ node, children, ...props }) => (
        <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>{children}</strong>
    ),
    ul: ({ node, children, ...props }) => (
        <ul className="list-disc list-outside ml-4 my-2 space-y-1 text-gray-600 dark:text-gray-300 text-[13px]" {...props}>{children}</ul>
    ),
    ol: ({ node, children, ...props }) => (
        <ol className="list-decimal list-outside ml-4 my-2 space-y-1 text-gray-600 dark:text-gray-300 text-[13px]" {...props}>{children}</ol>
    ),
    li: ({ node, children, ...props }) => <li className="leading-relaxed" {...props}>{children}</li>,
    code: ({ node, inline, children, ...props }) => (
        <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 font-mono text-[11px] border border-gray-200 dark:border-gray-700" {...props}>
            {children}
        </code>
    ),
    p: ({ node, children, ...props }) => (
        <p className="leading-relaxed mb-1.5 last:mb-0 text-gray-700 dark:text-gray-300 text-[13.5px]" {...props}>{children}</p>
    )
};

export default function CommandBar() {
    const [isOpen, setIsOpen]       = useState(false);
    const [query, setQuery]         = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [loading, setLoading]     = useState(false);
    const [copied, setCopied]       = useState(false);
    const [provider, setProviderState] = useState(() => localStorage.getItem(PROVIDER_STORAGE_KEY) || 'gemini');

    const inputRef = useRef(null);
    const navigate  = useNavigate();
    const location  = useLocation();
    const { user }  = useAuth();

    // Close on route change
    useEffect(() => { setIsOpen(false); }, [location.pathname]);

    const setProvider = (next) => {
        setProviderState(next);
        localStorage.setItem(PROVIDER_STORAGE_KEY, next);
    };

    const { isSignedIn: chatGptConnected, login: connectChatGPT } =
        useSignInWithChatGPT({ onSuccess: () => setProvider('chatgpt') });

    // Global keyboard shortcut
    useEffect(() => {
        const onKey = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            } else if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        const onOpen = () => setIsOpen(true);
        window.addEventListener('keydown', onKey);
        window.addEventListener('open-command-bar', onOpen);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('open-command-bar', onOpen);
        };
    }, [isOpen]);

    // Focus & reset
    useEffect(() => {
        if (isOpen)  { setTimeout(() => inputRef.current?.focus(), 60); }
        else         { setQuery(''); setAiResponse(null); setLoading(false); }
    }, [isOpen]);

    const handleAskAI = useCallback(async (questionText) => {
        const q = (questionText || query).trim();
        if (!q || loading) return;

        setLoading(true);
        setAiResponse(null);

        const username    = user?.name || user?.firstName || 'Learner';
        const csrfToken   = getCsrfToken();
        const csrfHeaders = csrfToken ? { 'X-CSRF-Token': csrfToken } : {};
        const activeP     = localStorage.getItem(PROVIDER_STORAGE_KEY) || 'gemini';
        const useChatGPT  = activeP === 'chatgpt' && chatGptConnected;

        try {
            const { data } = useChatGPT
                ? await axios.post(CHATGPT_ENDPOINT, { question: q, username },
                    { withCredentials: true, headers: { ...(await openaiAuthHeaders()), ...csrfHeaders } })
                : await axios.post(API_ENDPOINT, { question: q, username },
                    { withCredentials: true, headers: csrfHeaders });
            setAiResponse(data.answer);
        } catch {
            setAiResponse("Zen AI is unavailable right now. Try again or open the full chat workspace.");
        } finally {
            setLoading(false);
        }
    }, [query, loading, user, chatGptConnected]);

    const handleAction = (action) => {
        if (action.path)    { setIsOpen(false); navigate(action.path); }
        else if (action.prompt) { setQuery(action.prompt); handleAskAI(action.prompt); }
    };

    const handleCopy = async () => {
        if (!aiResponse) return;
        try { await navigator.clipboard.writeText(aiResponse); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
    };

    const filtered = query.trim()
        ? QUICK_ACTIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
        : QUICK_ACTIONS;

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex justify-center font-outfit"
            style={{ alignItems: 'flex-start', paddingTop: 'clamp(72px, 12vh, 130px)', padding: '0 16px' }}
        >
            {/* ── Backdrop ── */}
            <div
                className="absolute inset-0"
                style={{ background: 'rgba(15,15,20,0.45)', backdropFilter: 'blur(8px)' }}
                onClick={() => setIsOpen(false)}
            />

            {/* ── Panel ── */}
            <div
                className="relative w-full z-10 flex flex-col overflow-hidden"
                style={{
                    maxWidth: '620px',
                    marginTop: 'clamp(72px, 12vh, 130px)',
                    maxHeight: '78vh',
                    borderRadius: '18px',
                    background: '#ffffff',
                    border: '1px solid #e8e9ef',
                    boxShadow: '0 20px 60px -8px rgba(0,0,0,0.14), 0 4px 16px -4px rgba(0,0,0,0.07)',
                    animation: 'cbPanelIn 0.17s cubic-bezier(0.22,1,0.36,1) both',
                }}
            >
                {/* Dark mode panel style */}
                <style>{`
                    @media (prefers-color-scheme: dark) {}
                    .dark .cb-panel { background: #18181b !important; border-color: rgba(255,255,255,0.08) !important; }
                    .dark .cb-input-row { border-color: rgba(255,255,255,0.07) !important; }
                    .dark .cb-model-bar { background: #111113 !important; border-color: rgba(255,255,255,0.06) !important; }
                    .dark .cb-footer { background: #111113 !important; border-color: rgba(255,255,255,0.06) !important; color: #6b7280 !important; }
                    .dark .cb-footer kbd { background: #1c1c20 !important; border-color: rgba(255,255,255,0.08) !important; color: #9ca3af !important; }
                    .dark .cb-action-row:hover { background: rgba(99,102,241,0.07) !important; }
                    .dark .cb-action-icon { background: #27272a !important; border-color: rgba(255,255,255,0.06) !important; color: #9ca3af !important; }
                    .dark .cb-action-label { color: #e4e4e7 !important; }
                    .dark .cb-section-label { color: #52525b !important; }
                    .dark .cb-divider { background: rgba(255,255,255,0.05) !important; }
                    .dark .cb-input { color: #f4f4f5 !important; }
                    .dark .cb-input::placeholder { color: #71717a !important; }
                    .dark .cb-response-card { background: #f8f8ff08 !important; border-color: rgba(99,102,241,0.18) !important; }
                    .dark .cb-response-badge { background: rgba(99,102,241,0.12) !important; color: #a5b4fc !important; }
                    .dark .cb-copy-btn { background: #27272a !important; border-color: rgba(255,255,255,0.07) !important; color: #a1a1aa !important; }
                    .dark .cb-model-btn-active { background: #27272a !important; color: #a5b4fc !important; }
                    .dark .cb-panel { background: #18181b !important; }
                    @keyframes cbPanelIn {
                        from { opacity: 0; transform: scale(0.965) translateY(-10px); }
                        to   { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes cbFadeIn { from { opacity:0; } to { opacity:1; } }
                    .cb-response-anim { animation: cbFadeIn 0.22s ease both; }
                    .cb-scroll::-webkit-scrollbar { width: 4px; }
                    .cb-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
                    .dark .cb-scroll::-webkit-scrollbar-thumb { background: #3f3f46; }
                    .cb-action-row { cursor: pointer; border-radius: 10px; transition: background 0.12s; }
                    .cb-action-row:hover { background: rgba(99,102,241,0.06); }
                    .cb-action-row:hover .cb-action-label { color: #4f46e5 !important; }
                `}</style>

                {/* ── Search Input Row ── */}
                <div
                    className="cb-input-row flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: '1px solid #eeeef2' }}
                >
                    {/* Zen icon — simple, flat */}
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: '#eef2ff', color: '#6366f1' }}
                    >
                        <Sparkles className="w-4 h-4" />
                    </div>

                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskAI(); } }}
                        placeholder="Ask Zen AI or search…"
                        className="cb-input flex-1 bg-transparent text-[15px] font-medium focus:outline-none"
                        style={{ color: '#111827' }}
                    />

                    {/* Right controls */}
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400 flex-shrink-0" />
                    ) : query.trim() ? (
                        <button
                            onClick={() => handleAskAI()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[12px] font-semibold flex-shrink-0 transition-opacity hover:opacity-85 active:opacity-70"
                            style={{ background: '#6366f1' }}
                        >
                            <Send className="w-3 h-3" /> Ask Zen
                        </button>
                    ) : null}

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                        style={{ color: '#9ca3af' }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Model Switcher Bar ── */}
                <div
                    className="cb-model-bar flex items-center justify-between px-4 py-2"
                    style={{ borderBottom: '1px solid #eeeef2', background: '#fafafa' }}
                >
                    <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-gray-400 mr-1">Model</span>
                        <button
                            onClick={() => setProvider('gemini')}
                            className="cb-model-btn-active text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-all"
                            style={
                                provider === 'gemini' || !chatGptConnected
                                    ? { background: '#eef2ff', color: '#6366f1' }
                                    : { color: '#9ca3af' }
                            }
                        >
                            Zen AI
                        </button>
                        {chatGptConnected ? (
                            <button
                                onClick={() => setProvider('chatgpt')}
                                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-all flex items-center gap-1"
                                style={
                                    provider === 'chatgpt'
                                        ? { background: '#eef2ff', color: '#6366f1' }
                                        : { color: '#9ca3af' }
                                }
                            >
                                <Check className="w-3 h-3 text-emerald-500" />
                                ChatGPT
                            </button>
                        ) : (
                            <button
                                onClick={connectChatGPT}
                                className="text-[11px] font-medium flex items-center gap-1 hover:opacity-70 transition-opacity"
                                style={{ color: '#6366f1' }}
                            >
                                <ExternalLink className="w-3 h-3" /> Connect ChatGPT
                            </button>
                        )}
                    </div>
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border text-gray-400"
                        style={{ borderColor: '#e5e7eb', background: '#fff' }}>
                        ⌘K
                    </kbd>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="cb-scroll flex-1 overflow-y-auto py-2 px-2">

                    {/* AI Response Card */}
                    {aiResponse && (
                        <div className="cb-response-card cb-response-anim rounded-2xl p-4 mb-2 mx-1"
                            style={{ background: '#f5f5ff', border: '1px solid #e0e0fa' }}>
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-md flex items-center justify-center"
                                        style={{ background: '#eef2ff' }}>
                                        <Sparkles className="w-3 h-3 text-indigo-500" />
                                    </div>
                                    <span className="cb-response-badge text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                        style={{ background: '#eef2ff', color: '#6366f1' }}>
                                        Zen AI
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={handleCopy}
                                        className="cb-copy-btn flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80"
                                        style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280' }}
                                    >
                                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        {copied ? 'Copied' : 'Copy'}
                                    </button>
                                    <button
                                        onClick={() => { setIsOpen(false); navigate('/zen'); }}
                                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg text-white font-semibold hover:opacity-85 transition-opacity"
                                        style={{ background: '#6366f1' }}
                                    >
                                        Full Chat <ArrowRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            {/* Markdown Content */}
                            <div>
                                <ReactMarkdown remarkPlugins={[remarkBreaks]} components={MARKDOWN_COMPONENTS}>
                                    {aiResponse}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {/* Loading Skeleton */}
                    {loading && !aiResponse && (
                        <div className="rounded-2xl p-4 mb-2 mx-1"
                            style={{ background: '#f5f5ff', border: '1px solid #e0e0fa' }}>
                            <div className="flex items-center gap-2 mb-3">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                <span className="text-[12px] font-medium text-gray-400 animate-pulse">Zen is thinking…</span>
                            </div>
                            {[68, 52, 76, 38].map((w, i) => (
                                <div key={i} className="h-2 rounded-full mb-2 animate-pulse"
                                    style={{ width: `${w}%`, background: '#e0e0fa' }} />
                            ))}
                        </div>
                    )}

                    {/* ── Suggestions List ── */}
                    {filtered.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1.5 px-3 pt-1 pb-1">
                                <Zap className="w-3 h-3 text-gray-400" />
                                <span className="cb-section-label text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    Suggestions
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                {filtered.map(action => {
                                    const Icon = action.icon;
                                    return (
                                        <button
                                            key={action.id}
                                            onClick={() => handleAction(action)}
                                            className="cb-action-row w-full flex items-center gap-3 px-3 py-2.5 group text-left"
                                        >
                                            <div
                                                className="cb-action-icon w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                                                style={{ background: '#f3f4f6', border: '1px solid #e9eaec', color: '#6b7280' }}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span
                                                className="cb-action-label flex-1 text-[13.5px] font-medium text-left truncate transition-colors"
                                                style={{ color: '#374151' }}
                                            >
                                                {action.label}
                                            </span>
                                            <CornerDownLeft
                                                className="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300"
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {filtered.length === 0 && !loading && !aiResponse && query.trim() && (
                        <div className="py-10 text-center px-6">
                            <div className="w-10 h-10 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                                style={{ background: '#eef2ff' }}>
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                            </div>
                            <p className="text-[13px] font-medium text-gray-600 mb-1">No matching suggestions</p>
                            <p className="text-[12px] text-gray-400">
                                Press <kbd className="px-1.5 py-0.5 rounded border text-[11px]"
                                    style={{ background: '#f9fafb', borderColor: '#e5e7eb', color: '#374151' }}>Enter ↵</kbd>{' '}
                                to ask Zen AI
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div
                    className="cb-footer flex items-center justify-between px-4 py-2.5 text-[11px] text-gray-400"
                    style={{ borderTop: '1px solid #eeeef2', background: '#fafafa' }}
                >
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded border font-mono text-[10px] text-gray-500"
                                style={{ background: '#fff', borderColor: '#e5e7eb' }}>↵</kbd>
                            ask
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded border font-mono text-[10px] text-gray-500"
                                style={{ background: '#fff', borderColor: '#e5e7eb' }}>esc</kbd>
                            close
                        </span>
                    </div>
                    <button
                        onClick={() => { setIsOpen(false); navigate('/zen'); }}
                        className="flex items-center gap-1 font-medium hover:text-indigo-500 transition-colors"
                        style={{ color: '#9ca3af' }}
                    >
                        Zen Workspace <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
