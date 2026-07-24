import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
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
    ExternalLink
} from 'lucide-react';
import { getCsrfToken } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '').replace(/\/api$/, '');
// Its own endpoint (not /ask-ai) because that path's system prompt is
// deliberately restricted to "answer ONLY using ZenovaX help-center
// content" to protect the shared Gemini quota — which made it refuse every
// debugging question, since code isn't in that context. This endpoint skips
// that restriction since the caller already sends a complete, self-contained
// coding-assistant prompt.
const API_ENDPOINT = `${BASE_URL}/api/help/ask-code-debugger`;

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
        <strong className="font-semibold text-white" {...props}>{children}</strong>
    ),
    ul: ({ node, children, ...props }) => (
        <ul className="list-disc list-outside ml-4 my-1.5 space-y-1 text-gray-300 text-[13px]" {...props}>{children}</ul>
    ),
    ol: ({ node, children, ...props }) => (
        <ol className="list-decimal list-outside ml-4 my-1.5 space-y-1 text-gray-300 text-[13px]" {...props}>{children}</ol>
    ),
    li: ({ node, children, ...props }) => <li className="leading-relaxed" {...props}>{children}</li>,
    code: ({ node, inline, children, ...props }) => (
        <code
            className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 font-mono text-[11px] border border-white/10"
            {...props}
        >
            {children}
        </code>
    ),
    pre: ({ node, children, ...props }) => (
        <pre className="my-2 p-3 rounded-lg bg-black/40 border border-white/10 overflow-x-auto text-[12px] font-mono text-gray-300 leading-relaxed" {...props}>
            {children}
        </pre>
    ),
    p: ({ node, children, ...props }) => (
        <p className="leading-relaxed mb-2 last:mb-0 text-gray-300 text-[13.5px]" {...props}>{children}</p>
    ),
    h3: ({ node, children, ...props }) => (
        <h3 className="text-sm font-bold text-white mt-3 mb-1.5" {...props}>{children}</h3>
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

    const inputRef   = useRef(null);
    const bottomRef  = useRef(null);
    const { user }   = useAuth();

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
        const text = (overrideText || input).trim();
        if (!text || loading) return;

        const userMessage = { role: 'user', text };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);
        scrollToBottom();

        const csrfToken   = getCsrfToken();
        const csrfHeaders = csrfToken ? { 'X-CSRF-Token': csrfToken } : {};

        try {
            const { data } = await axios.post(
                API_ENDPOINT,
                {
                    question: buildContextPrompt(text),
                    username: user?.name || user?.firstName || 'Learner'
                },
                { withCredentials: true, headers: csrfHeaders }
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
    }, [input, loading, question, code, language, user]);

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
            {/* Subtle backdrop (doesn't block editor) */}
            <div
                className="fixed inset-0 z-[80] pointer-events-none"
                style={{ background: 'rgba(0,0,0,0.25)' }}
            />

            {/* Slide-in Panel */}
            <div
                className="fixed right-0 top-0 bottom-0 z-[90] flex flex-col font-sans"
                style={{
                    width: '420px',
                    background: '#16161a',
                    borderLeft: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '-20px 0 60px -10px rgba(0,0,0,0.5)',
                    animation: 'slideInRight 0.22s cubic-bezier(0.22,1,0.36,1) both',
                }}
            >
                <style>{`
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to   { transform: translateX(0);   opacity: 1; }
                    }
                    .debugger-scroll::-webkit-scrollbar { width: 4px; }
                    .debugger-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                    .debugger-input:focus { outline: none; }
                    .debugger-input::placeholder { color: rgba(255,255,255,0.25); }
                `}</style>

                {/* ── Header ── */}
                <div
                    className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: '#1c1c21' }}
                >
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
                        >
                            <Bug className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-[13px] font-bold text-white leading-tight">Zen AI Debugger</p>
                            <p className="text-[10px] text-gray-500 leading-none mt-0.5">Sees your question + code</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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

                {/* ── Context Preview Bar ── */}
                <div
                    className="px-4 py-2.5 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#111114' }}
                >
                    <button
                        onClick={() => setCodeVisible(v => !v)}
                        className="w-full flex items-center justify-between text-left group"
                    >
                        <div className="flex items-center gap-2">
                            <span
                                className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
                            >
                                {language}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium truncate max-w-[200px]">
                                {question?.title || 'Coding Question'}
                            </span>
                            <span
                                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                    background: question?.difficulty === 'HARD' ? 'rgba(239,68,68,0.15)' :
                                                question?.difficulty === 'MEDIUM' ? 'rgba(245,158,11,0.15)' :
                                                'rgba(16,185,129,0.15)',
                                    color: question?.difficulty === 'HARD' ? '#f87171' :
                                           question?.difficulty === 'MEDIUM' ? '#fbbf24' :
                                           '#34d399',
                                }}
                            >
                                {question?.difficulty}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 group-hover:text-gray-400 transition-colors">
                            <span className="text-[10px]">{codeVisible ? 'Hide' : 'Preview'}</span>
                            {codeVisible ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </div>
                    </button>

                    {codeVisible && (
                        <div
                            className="mt-2 rounded-lg overflow-hidden"
                            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                            <div className="flex items-center justify-between px-3 py-1.5"
                                style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span className="text-[10px] font-mono text-gray-500">Your current code</span>
                                <span className="text-[10px] text-gray-600">{code?.split('\n').length || 0} lines</span>
                            </div>
                            <pre className="p-3 font-mono text-[11px] text-gray-400 overflow-x-auto max-h-32 leading-relaxed"
                                style={{ background: 'rgba(0,0,0,0.3)' }}>
                                {code?.slice(0, 400) || '// empty'}{code?.length > 400 ? '\n…' : ''}
                            </pre>
                        </div>
                    )}
                </div>

                {/* ── Messages / Chat Body ── */}
                <div className="debugger-scroll flex-1 overflow-y-auto px-4 py-3 space-y-3">

                    {/* Empty state — quick prompt chips */}
                    {messages.length === 0 && !loading && (
                        <div className="space-y-4">
                            <div className="text-center pt-4">
                                <div
                                    className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}
                                >
                                    <Sparkles className="w-6 h-6 text-indigo-400" />
                                </div>
                                <p className="text-[13px] font-semibold text-white mb-1">Zen sees your code</p>
                                <p className="text-[12px] text-gray-500 leading-relaxed">
                                    Ask me to debug, hint, or explain.<br />I have full context of the question and your solution.
                                </p>
                            </div>

                            {/* Quick prompt chips */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                                    <button
                                        key={label}
                                        onClick={() => handleSend(prompt)}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        style={{
                                            background: 'rgba(255,255,255,0.04)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                        }}
                                    >
                                        <Icon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                                        <span className="text-[12px] font-medium text-gray-300">{label}</span>
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
                                    className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-[13.5px] text-white font-medium"
                                    style={{ background: '#6366f1' }}
                                >
                                    {msg.text}
                                </div>
                            ) : (
                                <div className="max-w-[95%] group">
                                    {/* AI icon + label */}
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <div
                                            className="w-4 h-4 rounded flex items-center justify-center"
                                            style={{ background: 'rgba(99,102,241,0.2)' }}
                                        >
                                            <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                                        </div>
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Zen AI</span>
                                    </div>
                                    {/* Content card */}
                                    <div
                                        className="px-4 py-3 rounded-2xl rounded-tl-sm"
                                        style={{
                                            background: msg.isError ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${msg.isError ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)'}`,
                                        }}
                                    >
                                        <ReactMarkdown remarkPlugins={[remarkBreaks]} components={MARKDOWN_COMPONENTS}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                    {/* Copy button */}
                                    <button
                                        onClick={() => handleCopy(msg.text, i)}
                                        className="mt-1 flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors opacity-0 group-hover:opacity-100"
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
                            <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)' }}>
                                        <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                                    </div>
                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Zen AI</span>
                                </div>
                                <div className="px-4 py-3 rounded-2xl rounded-tl-sm"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                        <span className="text-[12px] text-gray-500">Analyzing your code…</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* ── Input Row ── */}
                <div
                    className="px-3 py-3 flex-shrink-0"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: '#1c1c21' }}
                >
                    <div
                        className="flex items-end gap-2 px-3 py-2.5 rounded-2xl"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Ask Zen about your code… (Enter to send)"
                            rows={1}
                            className="debugger-input flex-1 bg-transparent text-[13.5px] text-white resize-none leading-relaxed"
                            style={{ maxHeight: '100px', minHeight: '20px' }}
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 hover:opacity-85 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            style={{ background: '#6366f1' }}
                        >
                            {loading
                                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                                : <Send className="w-4 h-4 text-white" />
                            }
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-600 mt-2">
                        Shift+Enter for new line · Zen sees your live code
                    </p>
                </div>
            </div>
        </>
    );
}
