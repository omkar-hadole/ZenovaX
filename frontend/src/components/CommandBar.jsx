import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { useSignInWithChatGPT, openaiAuthHeaders } from '@openai-oauth/react';
import {
    Sparkles,
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
    Loader2,
    Navigation,
    Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCsrfToken } from '../utils/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, "").replace(/\/api$/, "");
const API_ENDPOINT = `${BASE_URL}/api/help/ask-ai`;
const CHATGPT_ENDPOINT = `${BASE_URL}/api/help/ask-ai-chatgpt`;
const PROVIDER_STORAGE_KEY = 'zen-ai-provider';

const AI_ACTIONS = [
    { id: 'next-session',    icon: Calendar,     label: 'When is my next session?',                    prompt: 'When is my next session?' },
    { id: 'recommend',       icon: Users,         label: 'Recommend a mentor for Fullstack MERN',       prompt: 'Recommend top mentors for Fullstack MERN development' },
    { id: 'refund',          icon: HelpCircle,    label: 'What is the refund & cancellation policy?',   prompt: 'What is the refund and cancellation policy for sessions?' },
];

const NAV_ACTIONS = [
    { id: 'nav-bookings',    icon: BookOpen,      label: 'Go to My Bookings',                path: '/bookings' },
    { id: 'nav-mentors',     icon: Users,         label: 'Browse Mentors Directory',          path: '/mentors' },
    { id: 'nav-zen',         icon: MessageSquare, label: 'Open Zen AI Workspace',             path: '/zen' },
];

const MARKDOWN_COMPONENTS = {
    a: ({ node, children, href, ...props }) => (
        <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-violet-600 dark:text-violet-400 font-medium underline decoration-violet-300 dark:decoration-violet-700 underline-offset-2 hover:text-violet-700 dark:hover:text-violet-300 inline-flex items-center gap-0.5 transition-colors"
            {...props}
        >
            {children}<ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
        </a>
    ),
    strong: ({ node, children, ...props }) => (
        <strong className="font-semibold text-gray-900 dark:text-white" {...props}>{children}</strong>
    ),
    ul: ({ node, children, ...props }) => (
        <ul className="list-disc list-outside ml-4 my-2 space-y-1 text-gray-600 dark:text-gray-300 text-[13px]" {...props}>{children}</ul>
    ),
    ol: ({ node, children, ...props }) => (
        <ol className="list-decimal list-outside ml-4 my-2 space-y-1 text-gray-600 dark:text-gray-300 text-[13px]" {...props}>{children}</ol>
    ),
    li: ({ node, children, ...props }) => <li className="leading-relaxed" {...props}>{children}</li>,
    code: ({ node, inline, children, ...props }) => (
        <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-violet-700 dark:text-violet-300 font-mono text-[11px] border border-gray-200 dark:border-gray-700" {...props}>
            {children}
        </code>
    ),
    p: ({ node, children, ...props }) => (
        <p className="leading-relaxed mb-1 last:mb-0 text-gray-700 dark:text-gray-300 text-[13px]" {...props}>{children}</p>
    )
};

export default function CommandBar() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery]   = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [loading, setLoading]   = useState(false);
    const [copied, setCopied]     = useState(false);
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

    const {
        isSignedIn: chatGptConnected,
        login: connectChatGPT
    } = useSignInWithChatGPT({ onSuccess: () => setProvider('chatgpt') });

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
        if (isOpen) { setTimeout(() => inputRef.current?.focus(), 60); }
        else { setQuery(''); setAiResponse(null); setLoading(false); }
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
        if (action.path)   { setIsOpen(false); navigate(action.path); }
        else if (action.prompt) { setQuery(action.prompt); handleAskAI(action.prompt); }
    };

    const handleCopy = async () => {
        if (!aiResponse) return;
        try { await navigator.clipboard.writeText(aiResponse); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
    };

    const allActions  = [...AI_ACTIONS, ...NAV_ACTIONS];
    const filtered    = query.trim()
        ? allActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase()))
        : allActions;
    const filteredAI  = filtered.filter(a => !!a.prompt);
    const filteredNav = filtered.filter(a => !!a.path);
    const useChatGPTActive = provider === 'chatgpt' && chatGptConnected;

    if (!isOpen) return null;

    return (
        /* ── Backdrop ── */
        <div
            className="fixed inset-0 z-[9999] flex items-start justify-center font-outfit"
            style={{ paddingTop: 'clamp(64px, 12vh, 140px)', padding: '0 16px' }}
        >
            {/* Blurred overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            {/* ── Panel ── */}
            <div
                className="relative w-full max-w-[640px] flex flex-col overflow-hidden z-10"
                style={{
                    maxHeight: '76vh',
                    marginTop: 'clamp(64px, 12vh, 140px)',
                    borderRadius: '20px',
                    background: 'var(--cb-bg)',
                    border: '1px solid var(--cb-border)',
                    boxShadow: '0 32px 80px -10px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.04) inset',
                }}
            >
                <style>{`
                    :root {
                        --cb-bg: #ffffff;
                        --cb-bg2: #f8f8fb;
                        --cb-border: rgba(0,0,0,0.09);
                        --cb-text: #111827;
                        --cb-muted: #6b7280;
                        --cb-hover: rgba(124,114,250,0.07);
                        --cb-divider: rgba(0,0,0,0.06);
                        --cb-tag-bg: rgba(124,114,250,0.08);
                        --cb-tag-text: #6355e0;
                        --cb-violet: #7C72FA;
                    }
                    .dark {
                        --cb-bg: #141417;
                        --cb-bg2: #1c1c20;
                        --cb-border: rgba(255,255,255,0.08);
                        --cb-text: #f1f1f3;
                        --cb-muted: #8a8a9a;
                        --cb-hover: rgba(124,114,250,0.09);
                        --cb-divider: rgba(255,255,255,0.06);
                        --cb-tag-bg: rgba(124,114,250,0.14);
                        --cb-tag-text: #a79ffb;
                        --cb-violet: #9189fb;
                    }
                    .cb-input::placeholder { color: var(--cb-muted); }
                    .cb-scroll { overflow-y: auto; }
                    .cb-scroll::-webkit-scrollbar { width: 4px; }
                    .cb-scroll::-webkit-scrollbar-thumb { background: var(--cb-divider); border-radius: 4px; }
                    .cb-action-row:hover { background: var(--cb-hover); }
                    @keyframes cb-in { from { opacity:0; transform: scale(0.97) translateY(-8px); } to { opacity:1; transform: scale(1) translateY(0); } }
                    .cb-panel-anim { animation: cb-in 0.18s cubic-bezier(0.22,1,0.36,1) both; }
                    @keyframes cb-fade { from { opacity:0; } to { opacity:1; } }
                    .cb-response-anim { animation: cb-fade 0.25s ease both; }
                `}</style>

                {/* ── Search Row ── */}
                <div
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderBottom: '1px solid var(--cb-divider)' }}
                >
                    {/* Zen Icon */}
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7C72FA 0%, #a78bfa 100%)', boxShadow: '0 4px 12px rgba(124,114,250,0.35)' }}
                    >
                        <Sparkles className="w-4 h-4 text-white" />
                    </div>

                    {/* Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAskAI(); } }}
                        placeholder="Ask Zen AI or jump to a page..."
                        className="cb-input flex-1 bg-transparent text-[15px] font-medium focus:outline-none"
                        style={{ color: 'var(--cb-text)' }}
                    />

                    {/* Right side */}
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-violet-500 flex-shrink-0" />
                    ) : query.trim() ? (
                        <button
                            onClick={() => handleAskAI()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-[12px] font-semibold flex-shrink-0 transition-opacity hover:opacity-85"
                            style={{ background: 'linear-gradient(135deg, #7C72FA 0%, #9e94fb 100%)' }}
                        >
                            <Send className="w-3 h-3" /> Ask
                        </button>
                    ) : null}

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-white/10 flex-shrink-0"
                        style={{ color: 'var(--cb-muted)' }}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Model Switcher ── */}
                <div
                    className="flex items-center justify-between px-4 py-2"
                    style={{ borderBottom: '1px solid var(--cb-divider)', background: 'var(--cb-bg2)' }}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium" style={{ color: 'var(--cb-muted)' }}>Model:</span>
                        <button
                            onClick={() => setProvider('gemini')}
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-all"
                            style={
                                provider === 'gemini' || !chatGptConnected
                                    ? { background: 'var(--cb-tag-bg)', color: 'var(--cb-tag-text)' }
                                    : { color: 'var(--cb-muted)' }
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
                                        ? { background: 'var(--cb-tag-bg)', color: 'var(--cb-tag-text)' }
                                        : { color: 'var(--cb-muted)' }
                                }
                            >
                                <Check className="w-3 h-3 text-emerald-500" /> Your ChatGPT
                            </button>
                        ) : (
                            <button
                                onClick={connectChatGPT}
                                className="text-[11px] font-medium flex items-center gap-1 transition-colors hover:opacity-70"
                                style={{ color: 'var(--cb-violet)' }}
                            >
                                <ExternalLink className="w-3 h-3" /> Connect ChatGPT
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        <kbd
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md border"
                            style={{ color: 'var(--cb-muted)', borderColor: 'var(--cb-border)', background: 'var(--cb-bg)' }}
                        >
                            ⌘K
                        </kbd>
                        <span className="text-[10px]" style={{ color: 'var(--cb-muted)' }}>to toggle</span>
                    </div>
                </div>

                {/* ── Scrollable Body ── */}
                <div className="cb-scroll flex-1 py-3">

                    {/* AI Response */}
                    {aiResponse && (
                        <div className="cb-response-anim px-3 pb-3">
                            <div
                                className="rounded-2xl p-4"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(124,114,250,0.06) 0%, rgba(167,139,250,0.04) 100%)',
                                    border: '1px solid rgba(124,114,250,0.2)'
                                }}
                            >
                                {/* Response Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-5 h-5 rounded-md flex items-center justify-center"
                                            style={{ background: 'var(--cb-tag-bg)' }}
                                        >
                                            <Sparkles className="w-3 h-3" style={{ color: 'var(--cb-violet)' }} />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--cb-violet)' }}>
                                            {useChatGPTActive ? 'ChatGPT' : 'Zen AI'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={handleCopy}
                                            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all hover:opacity-80"
                                            style={{ color: 'var(--cb-muted)', background: 'var(--cb-bg)', border: '1px solid var(--cb-border)' }}
                                        >
                                            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                            {copied ? 'Copied' : 'Copy'}
                                        </button>
                                        <button
                                            onClick={() => { setIsOpen(false); navigate('/zen'); }}
                                            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg text-white font-semibold transition-all hover:opacity-85"
                                            style={{ background: 'var(--cb-violet)' }}
                                        >
                                            Open Zen <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                                {/* Response Text */}
                                <div>
                                    <ReactMarkdown remarkPlugins={[remarkBreaks]} components={MARKDOWN_COMPONENTS}>
                                        {aiResponse}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading Skeleton */}
                    {loading && !aiResponse && (
                        <div className="px-3 pb-3">
                            <div
                                className="rounded-2xl p-4 space-y-2.5"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(124,114,250,0.05) 0%, rgba(167,139,250,0.03) 100%)',
                                    border: '1px solid rgba(124,114,250,0.15)'
                                }}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--cb-violet)' }} />
                                    <span className="text-[12px] font-medium animate-pulse" style={{ color: 'var(--cb-muted)' }}>
                                        Zen is thinking…
                                    </span>
                                </div>
                                {[70, 55, 80, 40].map((w, i) => (
                                    <div
                                        key={i}
                                        className="h-2.5 rounded-full animate-pulse"
                                        style={{ width: `${w}%`, background: 'var(--cb-divider)' }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── AI Prompts Group ── */}
                    {filteredAI.length > 0 && (
                        <div className="mb-1">
                            <div className="flex items-center gap-1.5 px-4 pb-1.5">
                                <Zap className="w-3 h-3" style={{ color: 'var(--cb-muted)' }} />
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--cb-muted)' }}>
                                    Ask Zen
                                </span>
                            </div>
                            {filteredAI.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => handleAction(action)}
                                        className="cb-action-row w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left group"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                                            style={{
                                                background: 'var(--cb-tag-bg)',
                                                color: 'var(--cb-violet)'
                                            }}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span
                                            className="flex-1 text-[13.5px] font-medium truncate"
                                            style={{ color: 'var(--cb-text)' }}
                                        >
                                            {action.label}
                                        </span>
                                        <CornerDownLeft
                                            className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            style={{ color: 'var(--cb-muted)' }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Divider between AI and Nav sections */}
                    {filteredAI.length > 0 && filteredNav.length > 0 && (
                        <div className="mx-4 my-1.5" style={{ height: '1px', background: 'var(--cb-divider)' }} />
                    )}

                    {/* ── Navigation Group ── */}
                    {filteredNav.length > 0 && (
                        <div>
                            <div className="flex items-center gap-1.5 px-4 py-1.5">
                                <Navigation className="w-3 h-3" style={{ color: 'var(--cb-muted)' }} />
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--cb-muted)' }}>
                                    Navigate
                                </span>
                            </div>
                            {filteredNav.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => handleAction(action)}
                                        className="cb-action-row w-full flex items-center gap-3 px-4 py-2.5 transition-all text-left group"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'var(--cb-bg2)', color: 'var(--cb-muted)', border: '1px solid var(--cb-border)' }}
                                        >
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span
                                            className="flex-1 text-[13.5px] font-medium truncate"
                                            style={{ color: 'var(--cb-text)' }}
                                        >
                                            {action.label}
                                        </span>
                                        <ArrowRight
                                            className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                            style={{ color: 'var(--cb-muted)' }}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Empty state */}
                    {filtered.length === 0 && !loading && !aiResponse && (
                        <div className="py-12 text-center px-6">
                            <div
                                className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                                style={{ background: 'var(--cb-tag-bg)' }}
                            >
                                <Sparkles className="w-6 h-6" style={{ color: 'var(--cb-violet)' }} />
                            </div>
                            <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--cb-text)' }}>Ask Zen anything</p>
                            <p className="text-[12px]" style={{ color: 'var(--cb-muted)' }}>
                                Press <kbd className="px-1.5 py-0.5 rounded-md text-[11px] font-mono"
                                    style={{ background: 'var(--cb-bg2)', border: '1px solid var(--cb-border)', color: 'var(--cb-text)' }}>Enter ↵</kbd> to send "{query.trim()}"
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div
                    className="flex items-center justify-between px-4 py-2.5 text-[11px]"
                    style={{ borderTop: '1px solid var(--cb-divider)', color: 'var(--cb-muted)' }}
                >
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                                style={{ background: 'var(--cb-bg2)', border: '1px solid var(--cb-border)', color: 'var(--cb-text)' }}>↑↓</kbd>
                            navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                                style={{ background: 'var(--cb-bg2)', border: '1px solid var(--cb-border)', color: 'var(--cb-text)' }}>↵</kbd>
                            ask / open
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px]"
                                style={{ background: 'var(--cb-bg2)', border: '1px solid var(--cb-border)', color: 'var(--cb-text)' }}>esc</kbd>
                            close
                        </span>
                    </div>
                    <button
                        onClick={() => { setIsOpen(false); navigate('/zen'); }}
                        className="flex items-center gap-1 font-medium transition-opacity hover:opacity-70"
                        style={{ color: 'var(--cb-violet)' }}
                    >
                        Zen Workspace <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    );
}
