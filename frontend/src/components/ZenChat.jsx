import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, Sparkles, Link2, CheckCircle2, LogOut, Copy, Check, MessageSquarePlus, ExternalLink } from 'lucide-react';
import { useSignInWithChatGPT, openaiAuthHeaders } from '@openai-oauth/react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCsrfToken } from '../utils/api';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, "").replace(/\/api$/, "");
const API_ENDPOINT = `${BASE_URL}/api/help/ask-ai`;
const CHATGPT_ENDPOINT = `${BASE_URL}/api/help/ask-ai-chatgpt`;
const BRAND_COLOR = '#7A79E6';
const PROVIDER_STORAGE_KEY = 'zen-ai-provider';
const CHAT_STORAGE_KEY = 'zen-chat-history';

const loadStoredChat = () => {
    try {
        const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

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
        <div className="relative my-3 rounded-xl overflow-hidden border border-slate-800 bg-gray-950 text-gray-100 font-mono text-xs shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 text-gray-400 text-xs select-none">
                <span className="font-bold uppercase tracking-wider text-[11px] text-indigo-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                    {language || 'code'}
                </span>
                <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-all text-[11px] font-medium"
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
            <div className="p-3 overflow-x-auto custom-scrollbar">
                <SyntaxHighlighter
                    language={language || 'text'}
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        padding: 0,
                        background: 'transparent',
                        fontSize: '0.85rem',
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

const USER_MARKDOWN_COMPONENTS = {
    a: ({ node, children, href, ...props }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline font-semibold hover:text-indigo-100 inline-flex items-center gap-0.5 transition-colors"
            {...props}
        >
            {children}
            <ExternalLink className="w-3.5 h-3.5 inline ml-0.5 opacity-80" />
        </a>
    ),
    strong: ({ node, children, ...props }) => (
        <strong className="font-bold text-white" {...props}>
            {children}
        </strong>
    ),
    em: ({ node, children, ...props }) => (
        <em className="italic text-indigo-100" {...props}>
            {children}
        </em>
    ),
    h1: ({ node, children, ...props }) => (
        <h1 className="text-lg font-bold text-white mt-3 mb-1" {...props}>
            {children}
        </h1>
    ),
    h2: ({ node, children, ...props }) => (
        <h2 className="text-base font-bold text-white mt-2 mb-1" {...props}>
            {children}
        </h2>
    ),
    h3: ({ node, children, ...props }) => (
        <h3 className="text-sm font-semibold text-white mt-2 mb-1" {...props}>
            {children}
        </h3>
    ),
    ul: ({ node, children, ...props }) => (
        <ul className="list-disc list-outside ml-5 my-2 space-y-1 text-white" {...props}>
            {children}
        </ul>
    ),
    ol: ({ node, children, ...props }) => (
        <ol className="list-decimal list-outside ml-5 my-2 space-y-1 text-white" {...props}>
            {children}
        </ol>
    ),
    li: ({ node, children, ...props }) => (
        <li className="leading-relaxed" {...props}>
            {children}
        </li>
    ),
    blockquote: ({ node, children, ...props }) => (
        <blockquote className="border-l-4 border-white/60 pl-3 py-1 my-2 italic bg-white/10 text-white rounded-r" {...props}>
            {children}
        </blockquote>
    ),
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const codeString = String(children).replace(/\n$/, '');

        if (!inline && (match || codeString.includes('\n'))) {
            return <CodeBlock language={match ? match[1] : ''} value={codeString} />;
        }

        return (
            <code className="px-1.5 py-0.5 mx-0.5 rounded bg-white/20 text-white font-mono text-xs font-semibold" {...props}>
                {children}
            </code>
        );
    }
};

const ASSISTANT_MARKDOWN_COMPONENTS = {
    a: ({ node, children, href, ...props }) => (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 font-semibold underline underline-offset-2 hover:text-indigo-700 dark:hover:text-indigo-300 inline-flex items-center gap-0.5 transition-colors"
            {...props}
        >
            {children}
            <ExternalLink className="w-3.5 h-3.5 inline ml-0.5 opacity-80" />
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
    h1: ({ node, children, ...props }) => (
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2 border-b border-slate-200 dark:border-gray-800 pb-1" {...props}>
            {children}
        </h1>
    ),
    h2: ({ node, children, ...props }) => (
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-3 mb-2" {...props}>
            {children}
        </h2>
    ),
    h3: ({ node, children, ...props }) => (
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-2 mb-1" {...props}>
            {children}
        </h3>
    ),
    ul: ({ node, children, ...props }) => (
        <ul className="list-disc list-outside ml-5 my-2 space-y-1 text-slate-700 dark:text-gray-300" {...props}>
            {children}
        </ul>
    ),
    ol: ({ node, children, ...props }) => (
        <ol className="list-decimal list-outside ml-5 my-2 space-y-1 text-slate-700 dark:text-gray-300" {...props}>
            {children}
        </ol>
    ),
    li: ({ node, children, ...props }) => (
        <li className="leading-relaxed" {...props}>
            {children}
        </li>
    ),
    blockquote: ({ node, children, ...props }) => (
        <blockquote className="border-l-4 border-indigo-500 pl-4 py-1.5 my-3 italic bg-indigo-50/60 dark:bg-indigo-950/40 text-slate-700 dark:text-gray-300 rounded-r-lg" {...props}>
            {children}
        </blockquote>
    ),
    code({ node, inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        const codeString = String(children).replace(/\n$/, '');

        if (!inline && (match || codeString.includes('\n'))) {
            return <CodeBlock language={match ? match[1] : ''} value={codeString} />;
        }

        return (
            <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-gray-800/90 text-indigo-600 dark:text-indigo-300 font-mono text-xs font-semibold border border-slate-200 dark:border-gray-700/60" {...props}>
                {children}
            </code>
        );
    }
};

const ChatMessageItem = React.memo(({ m, i, isCopied, onCopy }) => {
    const isUser = m.role === 'user';
    return (
        <div className={`group flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed ${
                    isUser
                        ? 'text-white rounded-tr-sm shadow-md shadow-indigo-500/10'
                        : 'bg-white/80 dark:bg-gray-800/80 border border-slate-100 dark:border-gray-700 text-slate-700 dark:text-gray-300 rounded-tl-sm shadow-sm'
                }`}
                style={{ backgroundColor: isUser ? BRAND_COLOR : undefined }}
            >
                <ReactMarkdown
                    remarkPlugins={[remarkBreaks, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={isUser ? USER_MARKDOWN_COMPONENTS : ASSISTANT_MARKDOWN_COMPONENTS}
                >
                    {m.text}
                </ReactMarkdown>
            </div>
            {!isUser && (
                <button
                    onClick={() => onCopy(m.text, i)}
                    className={`mt-1.5 ml-1 flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all ${
                        isCopied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                >
                    {isCopied ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied
                        </>
                    ) : (
                        <>
                            <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                    )}
                </button>
            )}
        </div>
    );
});

const AnimatedOrb = React.memo(({ isTyping, isThinking, isDark }) => {
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

        let isVisible = true;
        const observer = new IntersectionObserver(
            ([entry]) => {
                isVisible = entry.isIntersecting;
            },
            { threshold: 0.05 }
        );
        observer.observe(canvas);

        const animate = () => {
            if (isVisible && !document.hidden) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius + 40);
                if (isDark) {
                    gradient.addColorStop(0, 'rgba(140, 130, 255, 0.95)');
                    gradient.addColorStop(0.35, 'rgba(100, 80, 230, 0.55)');
                    gradient.addColorStop(0.7, 'rgba(80, 60, 200, 0.15)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                } else {
                    gradient.addColorStop(0, 'rgba(180, 190, 255, 0.9)');
                    gradient.addColorStop(0.4, 'rgba(122, 121, 230, 0.5)');
                    gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0)');
                }
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                particlesRef.current.forEach((particle) => {
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
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            observer.disconnect();
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isTyping, isThinking, isDark]);

    return <canvas ref={canvasRef} width={200} height={200} className="mx-auto" />;
});

export default function ZenChat({ fallbackName = 'Creator' }) {
    const [chat, setChat] = useState(loadStoredChat);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [provider, setProviderState] = useState(() => localStorage.getItem(PROVIDER_STORAGE_KEY) || 'gemini');
    const [showQuotaSuggestion, setShowQuotaSuggestion] = useState(false);
    const [thinkingSeconds, setThinkingSeconds] = useState(0);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const bottomRef = useRef(null);

    const setProvider = (next) => {
        setProviderState(next);
        localStorage.setItem(PROVIDER_STORAGE_KEY, next);
    };

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

    const prevChatLengthRef = useRef(chat.length);
    useEffect(() => {
        if (chat.length > prevChatLengthRef.current || loading) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
        prevChatLengthRef.current = chat.length;
    }, [chat.length, loading]);

    useEffect(() => {
        sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chat));
    }, [chat]);

    const handleNewChat = () => {
        setChat([]);
        sessionStorage.removeItem(CHAT_STORAGE_KEY);
        setShowQuotaSuggestion(false);
        setInput('');
    };

    useEffect(() => {
        if (!loading) {
            setThinkingSeconds(0);
            return;
        }
        const intervalId = setInterval(() => {
            setThinkingSeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [loading]);

    const getThinkingMessage = (seconds) => {
        if (seconds < 4) return 'Zen is thinking';
        if (seconds < 10) return 'Still working on it';
        if (seconds < 18) return 'Almost done';
        return 'Just a little longer';
    };

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

        const username = user?.name || user?.firstName || fallbackName;
        const useChatGPT = provider === 'chatgpt' && chatGptConnected;

        const csrfToken = getCsrfToken();
        const csrfHeaders = csrfToken ? { 'X-CSRF-Token': csrfToken } : {};

        try {
            const { data } = useChatGPT
                ? await axios.post(CHATGPT_ENDPOINT, { question: q, username }, {
                    withCredentials: true,
                    headers: { ...(await openaiAuthHeaders()), ...csrfHeaders }
                })
                : await axios.post(API_ENDPOINT, { question: q, username }, {
                    withCredentials: true,
                    headers: csrfHeaders
                });

            setChat(prev => [...prev, { role: 'assistant', text: data.answer }]);
            if (data.suggestChatGPT && !chatGptConnected) {
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

    const handleCopy = useCallback(async (text, index) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(prev => (prev === index ? null : prev)), 2000);
        } catch {}
    }, []);

    return (
        <div className="h-[calc(100vh-6rem)] bg-white dark:bg-gray-950 flex flex-col relative font-outfit overflow-hidden">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-100/40 dark:bg-purple-500/10 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-100/40 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>

            {chat.length > 0 && (
                <button
                    onClick={handleNewChat}
                    title="New chat"
                    className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-gray-400 bg-white/80 dark:bg-gray-900/80 border border-slate-100 dark:border-gray-700 shadow-sm hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all backdrop-blur-sm"
                >
                    <MessageSquarePlus className="w-4 h-4" /> New Chat
                </button>
            )}

            <div className="flex-1 w-full overflow-y-auto relative z-10 flex flex-col items-center custom-scrollbar [contain:content]">
                <div className="w-full max-w-[900px] flex flex-col items-center my-auto p-4 pb-4">

                    <div className="text-center w-full mb-8">
                        <div className="flex justify-center mb-6 scale-125">
                            <AnimatedOrb isTyping={isTyping} isThinking={loading} isDark={isDark} />
                        </div>

                        {chat.length === 0 && (
                            <div className="space-y-2">
                                <h1 className="text-[2.5rem] font-semibold text-[#1F1F1F] dark:text-gray-100 tracking-[-0.02em]">
                                    {getGreeting()}, {user?.name || fallbackName}
                                </h1>
                                <h2 className="text-[2.5rem] font-semibold text-[#1F1F1F] dark:text-gray-100 tracking-[-0.02em]">
                                    How Can I <span style={{ color: BRAND_COLOR }} className="">Assist You Today?</span>
                                </h2>
                            </div>
                        )}
                    </div>

                    {chat.length > 0 && (
                        <div className="w-full max-w-[850px] space-y-4 mb-4 px-4">
                            {chat.map((m, i) => (
                                <ChatMessageItem
                                    key={i}
                                    m={m}
                                    i={i}
                                    isCopied={copiedIndex === i}
                                    onCopy={handleCopy}
                                />
                            ))}
                            {loading && (
                                <div className="px-4">
                                    <div className="text-sm text-slate-400 dark:text-gray-500 font-medium flex items-center gap-2">
                                        <span className="flex gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
                                        </span>
                                        {getThinkingMessage(thinkingSeconds)}
                                        {thinkingSeconds > 0 && ` · ${thinkingSeconds}s`}
                                    </div>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full flex justify-center p-6 pt-2 z-50 bg-white/0">
                <div className="w-full max-w-[850px]">

                    {showQuotaSuggestion && (
                        <div className="mb-3 px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between gap-3 text-sm">
                            <span className="text-indigo-700 dark:text-indigo-300">
                                Zen's default assistant is busy right now. Connect your own ChatGPT account to keep chatting.
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

                        <div className="pb-2 pl-1.5">
                            <Sparkles className="w-5 h-5 opacity-60" style={{ color: BRAND_COLOR }} />
                        </div>

                        <textarea
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Initiate a query or send a command to the AI..."
                            className="w-full bg-transparent text-[15px] text-slate-700 dark:text-gray-300 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none resize-none py-2 max-h-[100px] overflow-y-auto leading-relaxed"
                            style={{ height: '40px' }}
                            spellCheck={false}
                        />

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
                    <p className="text-[11px] text-slate-400 dark:text-gray-500 text-center mt-2 select-none">Zen is AI and can make mistakes.</p>
                </div>
            </div>
        </div>
    );
}
