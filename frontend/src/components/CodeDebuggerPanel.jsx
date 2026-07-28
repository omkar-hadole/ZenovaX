import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
    Sparkles,
    X,
    Send,
    Loader2,
    ChevronDown,
    ChevronUp,
    Copy,
    Check,
    Bug,
    Lightbulb,
    Zap,
    ExternalLink,
    Lock,
    Link2,
    GripVertical
} from 'lucide-react';
import { useSignInWithChatGPT, openaiAuthHeaders } from '@openai-oauth/react';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '').replace(/\/api$/, '');
// Deliberately requires the user's own connected ChatGPT account — never
// falls back to ZenovaX's shared Gemini key. Debugging prompts embed the
// full question + test cases + the user's live code, a much heavier payload
// than a typical help question, so this keeps that cost off the shared free
// quota entirely (see helpService.js#askCodeDebugger for the server-side
// enforcement of the same rule).
const API_ENDPOINT = `${BASE_URL}/api/help/ask-code-debugger`;

const CodeBlock = React.memo(({ language, value }) => {
    const [copied, setCopied] = useState(false);

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    return (
        <div className="relative my-3 rounded-xl overflow-hidden border border-white/10 bg-black/50 text-gray-100 font-mono text-xs shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10 text-gray-400 text-xs select-none">
                <span className="font-bold uppercase tracking-wider text-[11px] text-indigo-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    {language || 'code'}
                </span>
                <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-[11px] font-medium"
                    title="Copy code"
                >
                    {copied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy code</span>
                        </>
                    )}
                </button>
            </div>
            <div className="p-3 overflow-x-auto debugger-scroll">
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: 0,
                        background: 'transparent',
                        fontSize: '0.8rem',
                        lineHeight: '1.6',
                    }}
                    codeTagProps={{
                        style: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }
                    }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
});

const MARKDOWN_COMPONENTS = {
    a: ({ node, children, href, ...props }) => (
        <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 inline-flex items-center gap-0.5 transition-colors"
            {...props}
        >
            {children}<ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
        </a>
    ),
    strong: ({ node, children, ...props }) => (
        <strong className="font-bold text-white" {...props}>{children}</strong>
    ),
    em: ({ node, children, ...props }) => (
        <em className="italic text-gray-200" {...props}>{children}</em>
    ),
    h1: ({ node, children, ...props }) => (
        <h1 className="text-lg font-bold text-white mt-4 mb-2 border-b border-white/10 pb-1" {...props}>{children}</h1>
    ),
    h2: ({ node, children, ...props }) => (
        <h2 className="text-base font-bold text-white mt-3 mb-1.5" {...props}>{children}</h2>
    ),
    h3: ({ node, children, ...props }) => (
        <h3 className="text-sm font-semibold text-white mt-2.5 mb-1" {...props}>{children}</h3>
    ),
    ul: ({ node, children, ...props }) => (
        <ul className="list-disc list-outside ml-5 my-2 space-y-1 text-gray-300 text-[13px]" {...props}>{children}</ul>
    ),
    ol: ({ node, children, ...props }) => (
        <ol className="list-decimal list-outside ml-5 my-2 space-y-1 text-gray-300 text-[13px]" {...props}>{children}</ol>
    ),
    li: ({ node, children, ...props }) => <li className="leading-relaxed" {...props}>{children}</li>,
    table: ({ node, children, ...props }) => (
        <div className="my-3 overflow-x-auto rounded-lg border border-white/10" {...props}>
            <table className="w-full text-[12.5px] border-collapse" {...props}>{children}</table>
        </div>
    ),
    thead: ({ node, children, ...props }) => (
        <thead className="bg-white/5 border-b border-white/10" {...props}>{children}</thead>
    ),
    tbody: ({ node, children, ...props }) => (
        <tbody className="divide-y divide-white/5" {...props}>{children}</tbody>
    ),
    tr: ({ node, children, ...props }) => (
        <tr className="hover:bg-white/5 transition-colors" {...props}>{children}</tr>
    ),
    th: ({ node, children, ...props }) => (
        <th className="px-3 py-2 text-left font-bold text-indigo-300 uppercase tracking-wider text-[11px]" {...props}>{children}</th>
    ),
    td: ({ node, children, ...props }) => (
        <td className="px-3 py-2 text-gray-300 whitespace-nowrap" {...props}>{children}</td>
    ),
    blockquote: ({ node, children, ...props }) => (
        <blockquote className="border-l-4 border-indigo-500/60 pl-4 py-1.5 my-3 italic bg-indigo-500/10 text-gray-300 rounded-r-lg" {...props}>{children}</blockquote>
    ),
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const codeString = String(children).replace(/\n$/, '');

        if (!inline && (match || codeString.includes('\n'))) {
            return <CodeBlock language={match ? match[1] : ''} value={codeString} />;
        }

        return (
            <code className="px-1.5 py-0.5 mx-0.5 rounded bg-white/10 text-indigo-300 font-mono text-[11px] border border-white/10" {...props}>
                {children}
            </code>
        );
    },
    p: ({ node, children, ...props }) => (
        <p className="leading-relaxed mb-2 last:mb-0 text-gray-300 text-[13.5px]" {...props}>{children}</p>
    ),
};

const QUICK_PROMPTS = [
    { icon: Bug,       label: 'Debug my code',         prompt: 'Find bugs in my code and explain what is wrong.' },
    { icon: Lightbulb, label: 'Hint (no spoilers)',     prompt: 'Give me a hint to solve this question without revealing the full solution.' },
    { icon: Zap,       label: 'Optimize approach',     prompt: 'How can I optimize my current approach? What is the better algorithm or data structure for this problem?' },
    { icon: Sparkles,  label: 'Explain the problem',   prompt: 'Explain this coding question to me in simpler terms and describe the approach I should take.' },
];

/**
 * Context-Aware Coding Debugger Panel
 * Props:
 *   question  — the full question object (title, description, testCases, difficulty)
 *   code      — the user's current editor code string
 *   language  — the current language ('javascript' | 'python' | 'java')
 *   isOpen    — boolean controlling visibility
 *   onClose   — callback to close
 */
export default function CodeDebuggerPanel({ question, code, language, isOpen, onClose }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [codeVisible, setCodeVisible] = useState(false);
    const [copiedIdx, setCopiedIdx]     = useState(null);
    const [panelWidth, setPanelWidth]   = useState(420);

    const inputRef    = useRef(null);
    const bottomRef   = useRef(null);
    const isDragging  = useRef(false);
    const panelRef    = useRef(null);
    const thinkingTimerRef = useRef(null);

    const [thinkingSeconds, setThinkingSeconds] = useState(0);

    const getThinkingMessage = useMemo(() => (seconds) => {
        if (seconds < 3) return 'Zen is thinking';
        if (seconds < 6) return 'Seeing your code...';
        if (seconds < 10) return 'Understanding the problem...';
        if (seconds < 15) return 'Working on it...';
        if (seconds < 20) return 'Almost done...';
        return 'Just a little longer...';
    }, []);

    useEffect(() => {
        if (loading) {
            setThinkingSeconds(0);
            thinkingTimerRef.current = setInterval(() => {
                setThinkingSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
            setThinkingSeconds(0);
        }
        return () => {
            if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
        };
    }, [loading]);

    // Same hook, same default (no custom sessionStore/redirectUri) as
    // Zen.jsx — that means it reads/writes the exact same underlying
    // IndexedDB-backed session, so connecting once in either place unlocks
    // both seamlessly, and disconnecting locks both. No page-specific wiring
    // needed for that — it's just how the library's default session store
    // works when both call sites use it unmodified.
    const {
        status: chatGptStatus,
        installUrl: chatGptInstallUrl,
        isSignedIn: chatGptConnected,
        login: connectChatGPT,
    } = useSignInWithChatGPT();
    const needsChatGptExtension = chatGptStatus === 'needs-extension';

    // Auto-focus the input the moment the panel opens (once unlocked), so
    // the user can start typing immediately instead of having to click in.
    useEffect(() => {
        if (isOpen && chatGptConnected) {
            const focusTimer = setTimeout(() => inputRef.current?.focus(), 250);
            return () => clearTimeout(focusTimer);
        }
    }, [isOpen, chatGptConnected]);

    // Esc closes the panel, matching standard modal/panel conventions.
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Panel resize via drag handle
    const handleDragStart = useCallback((e) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const handleDragMove = (ev) => {
            if (!isDragging.current || !panelRef.current) return;
            const newWidth = window.innerWidth - ev.clientX;
            setPanelWidth(Math.max(320, Math.min(window.innerWidth * 0.6, newWidth)));
        };

        const handleDragEnd = () => {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
        };

        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
    }, []);

    const scrollToBottom = () => {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };

    // Build a rich system-context prompt from the question + code
    const buildContextPrompt = (userQuestion) => {
        const testCasesText = (() => {
            try {
                const cases = typeof question?.testCases === 'string'
                    ? JSON.parse(question.testCases)
                    : question?.testCases;
                return cases?.slice(0, 3).map((tc, i) =>
                    `Test Case ${i + 1}: Input = ${tc.input}, Expected Output = ${tc.output}${tc.isHidden ? ' [Hidden]' : ''}`
                ).join('\n') || 'Not available';
            } catch { return 'Not available'; }
        })();

        return `You are Zen, an expert coding assistant inside ZenovaX's coding platform. The user is working on a coding problem.

--- CODING QUESTION ---
Title: ${question?.title || 'Unknown'}
Difficulty: ${question?.difficulty || 'Unknown'}
Description: ${question?.description || 'Not available'}

--- EXAMPLE TEST CASES ---
${testCasesText}

--- USER'S CURRENT CODE (${language}) ---
\`\`\`${language}
${code || '// (empty)'}
\`\`\`
--- END CODE ---

Your job:
- You can SEE the user's exact code and the question.
- Be a helpful coding debugger, tutor, and guide.
- When debugging: point out the specific bug, line number if possible, and the fix.
- When hinting: guide the user's thinking WITHOUT giving the full answer.
- Be concise, use code blocks for code, and be friendly.
- Do NOT refuse to help with coding — this is a coding assistant, general CS is always in scope.

User's request: ${userQuestion}`;
    };

    const handleSend = useCallback(async (overrideText) => {
        if (!chatGptConnected) return;
        const text = (overrideText || input).trim();
        if (!text || loading) return;

        const userMessage = { role: 'user', text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        scrollToBottom();

        try {
            const { data } = await axios.post(
                API_ENDPOINT,
                { question: buildContextPrompt(text) },
                { headers: await openaiAuthHeaders() }
            );
            setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: "I couldn't reach Zen AI right now. Check your connection and try again.",
                isError: true
            }]);
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    }, [input, loading, question, code, language, chatGptConnected]);

    const handleCopy = async (text, idx) => {
        try { await navigator.clipboard.writeText(text); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000); } catch {}
    };

    const handleClear = () => {
        setMessages([]);
        setInput('');
    };

    if (!isOpen) return null;

    return (
        <>
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to   { transform: translateX(0);   opacity: 1; }
                }
                .debugger-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent; }
                .debugger-scroll::-webkit-scrollbar { width: 4px; }
                .debugger-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
                .debugger-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
                .debugger-input:focus { outline: none; }
                .debugger-input::placeholder { color: rgba(255,255,255,0.25); }
                .debugger-resize-handle { cursor: col-resize; transition: background 0.15s; }
                .debugger-resize-handle:hover { background: rgba(99,102,241,0.4) !important; }
            `}</style>

            <div
                ref={panelRef}
                className="fixed right-0 top-16 bottom-0 z-[90] flex flex-col font-sans"
                style={{
                    width: panelWidth,
                    maxWidth: '92vw',
                    background: '#16161a',
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '-20px 0 60px -10px rgba(0,0,0,0.5)',
                    animation: 'slideInRight 0.22s cubic-bezier(0.22,1,0.36,1) both',
                }}
            >
                {/* Resize Handle */}
                <div
                    onMouseDown={handleDragStart}
                    className="debugger-resize-handle absolute left-0 top-0 bottom-0 w-1.5 z-50 hover:w-2 transition-all"
                    style={{ background: 'transparent', marginLeft: '-3px' }}
                >
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity">
                        <GripVertical className="w-3 h-3 text-gray-500" />
                    </div>
                </div>

                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#1a1a1f' }}
                >
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}
                        >
                            <Bug className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <p className="text-[13px] font-semibold text-white">Zen AI</p>
                    </div>
                    <div className="flex items-center gap-1">
                        {messages.length > 0 && (
                            <button
                                onClick={handleClear}
                                className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-gray-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Locked state */}
                {!chatGptConnected ? (
                    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                        <div
                            className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center"
                            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.15)' }}
                        >
                            <Lock className="w-5 h-5 text-indigo-400" />
                        </div>
                        <p className="text-[14px] font-semibold text-white mb-1.5">Connect ChatGPT</p>
                        <p className="text-[12px] text-gray-500 leading-relaxed mb-5 max-w-[260px]">
                            Connect your ChatGPT account to use the AI debugger.
                        </p>

                        {needsChatGptExtension ? (
                            <div className="space-y-2 w-full max-w-[220px]">
                                <button
                                    onClick={() => window.open(chatGptInstallUrl, '_blank', 'noopener,noreferrer')}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                                    style={{ background: '#6366f1' }}
                                >
                                    <Link2 className="w-3.5 h-3.5" /> Install Extension
                                </button>
                                <button
                                    onClick={connectChatGPT}
                                    className="w-full text-[11px] text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors"
                                >
                                    Installed? Try again
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={connectChatGPT}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                                style={{ background: '#6366f1' }}
                            >
                                <Link2 className="w-3.5 h-3.5" /> Connect ChatGPT
                            </button>
                        )}
                    </div>
                ) : (
                <>
                {/* Context Preview Bar */}
                <div
                    className="px-4 py-2 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#131316' }}
                >
                    <button
                        onClick={() => setCodeVisible(v => !v)}
                        className="w-full flex items-center justify-between text-left group"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span
                                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}
                            >
                                {language}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium truncate">
                                {question?.title || 'Coding Question'}
                            </span>
                            <span
                                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                                style={{
                                    background: question?.difficulty === 'HARD' ? 'rgba(239,68,68,0.12)' :
                                                question?.difficulty === 'MEDIUM' ? 'rgba(245,158,11,0.12)' :
                                                'rgba(16,185,129,0.12)',
                                    color: question?.difficulty === 'HARD' ? '#f87171' :
                                           question?.difficulty === 'MEDIUM' ? '#fbbf24' :
                                           '#34d399',
                                }}
                            >
                                {question?.difficulty}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 ml-2">
                            {codeVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </div>
                    </button>

                    {codeVisible && (
                        <pre className="mt-2 p-2.5 rounded-lg font-mono text-[11px] text-gray-400 overflow-x-auto max-h-28 leading-relaxed"
                            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {code?.slice(0, 350) || '// empty'}{code?.length > 350 ? '\n…' : ''}
                        </pre>
                    )}
                </div>

                {/* ── Messages / Chat Body ── */}
                <div className="debugger-scroll flex-1 overflow-y-auto px-4 py-3 space-y-3">

                    {/* Empty state */}
                    {messages.length === 0 && !loading && (
                        <div className="space-y-3 pt-6">
                            <div className="text-center">
                                <div
                                    className="w-10 h-10 rounded-xl mx-auto mb-2.5 flex items-center justify-center"
                                    style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.15)' }}
                                >
                                    <Sparkles className="w-5 h-5 text-indigo-400" />
                                </div>
                                <p className="text-[12px] text-gray-500">What can I help with?</p>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                                {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                                    <button
                                        key={label}
                                        onClick={() => handleSend(prompt)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all hover:bg-white/[0.06] active:scale-[0.98]"
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.06)',
                                        }}
                                    >
                                        <Icon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                        <span className="text-[11.5px] text-gray-300">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Message Bubbles */}
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'user' ? (
                                <div
                                    className="max-w-[85%] px-3 py-2 rounded-2xl rounded-tr-sm text-[13px] text-white"
                                    style={{ background: '#6366f1' }}
                                >
                                    {msg.text}
                                </div>
                            ) : (
                                <div className="max-w-[95%] group">
                                    <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                                        <span className="text-[10px] font-semibold text-indigo-400">Zen AI</span>
                                    </div>
                                    <div
                                        className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm"
                                        style={{
                                            background: msg.isError ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${msg.isError ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)'}`,
                                        }}
                                    >
                                        <ReactMarkdown
                                            remarkPlugins={[remarkBreaks, remarkMath, remarkGfm]}
                                            rehypePlugins={[rehypeKatex]}
                                            components={MARKDOWN_COMPONENTS}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(msg.text, i)}
                                        className="mt-1 ml-1 flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        {copiedIdx === i ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                        {copiedIdx === i ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                    <span className="text-[12px] text-gray-500">{getThinkingMessage(thinkingSeconds)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* Input Row */}
                <div
                    className="px-3 py-3 flex-shrink-0"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#1a1a1f' }}
                >
                    <div
                        className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => {
                                setInput(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                    e.target.style.height = 'auto';
                                }
                            }}
                            placeholder="Ask Zen anything…"
                            rows={1}
                            className="debugger-input flex-1 bg-transparent text-[13px] text-white resize-none leading-relaxed"
                            style={{ maxHeight: '100px', minHeight: '20px' }}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0 hover:opacity-85 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed"
                            style={{ background: '#6366f1' }}
                        >
                            {loading
                                ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                : <Send className="w-3.5 h-3.5 text-white" />
                            }
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-600 text-center mt-2 select-none">Zen is AI and can make mistakes.</p>
                </div>
                </>
                )}
            </div>
        </>
    );
}
