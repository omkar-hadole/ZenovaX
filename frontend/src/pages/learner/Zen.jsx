import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Send, Sparkles } from 'lucide-react';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, "").replace(/\/api$/, "");
const API_ENDPOINT = `${BASE_URL}/api/help/ask-ai`;
const BRAND_COLOR = '#7A79E6'; // ZenovaX Brand Color

const AnimatedOrb = ({ isTyping, isThinking }) => {
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

            // Exact orb gradient from image (blue -> purple -> pink white soft)
            const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius + 40);
            gradient.addColorStop(0, 'rgba(180, 190, 255, 0.9)');
            gradient.addColorStop(0.4, 'rgba(122, 121, 230, 0.5)');
            gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0)');
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
                ctx.fillStyle = `rgba(122, 121, 230, ${particle.opacity})`;
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
    }, [isTyping, isThinking]);

    return <canvas ref={canvasRef} width={200} height={200} className="mx-auto" />;
};

const Zen = () => {
    const [chat, setChat] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));


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
        setChat(prev => [...prev, { role: 'user', text: q }]);

        try {
            const username = user.name || user.firstName || "Creator";
            const { data } = await axios.post(API_ENDPOINT, { question: q, username });
            setChat(prev => [...prev, { role: 'assistant', text: data.answer }]);
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

        <div className="h-[calc(100vh-6rem)] bg-white flex flex-col relative font-outfit overflow-hidden">
            {/* Soft Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>

            {/* Main Scrollable Area */}
            <div className="flex-1 w-full overflow-y-auto relative z-10 flex flex-col items-center custom-scrollbar">
                <div className="w-full max-w-[900px] flex flex-col items-center my-auto p-4 pb-4">

                    {/* Header Section */}
                    <div className="text-center w-full mb-8">
                        {/* Orb */}
                        <div className="flex justify-center mb-6 scale-125">
                            <AnimatedOrb isTyping={isTyping} isThinking={loading} />
                        </div>

                        {/* Greeting */}
                        {chat.length === 0 && (
                            <div className="space-y-2">
                                <h1 className="text-[2.5rem] font-semibold text-[#1F1F1F] tracking-[-0.02em]">
                                    {getGreeting()}, {user.name || 'Judha'}
                                </h1>
                                <h2 className="text-[2.5rem] font-semibold text-[#1F1F1F] tracking-[-0.02em]">
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
                                        : 'bg-white/80 border border-slate-100 text-slate-700 rounded-tl-sm shadow-sm'
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
                                    <div className="text-sm text-slate-400 font-medium flex items-center gap-2">
                                        Zen is thinking...
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Input Footer - Stays at bottom */}
            <div className="w-full flex justify-center p-6 pt-2 z-50 bg-white/0">
                <div className="w-full max-w-[850px]">
                    <div className="w-full bg-white border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] rounded-[26px] p-3 relative flex items-end gap-3 transition-all focus-within:shadow-[0_20px_60px_-15px_rgba(122,121,230,0.15)] focus-within:border-[#7A79E6]/30">

                        {/* Sparkles Icon */}
                        <div className="pb-3 pl-2">
                            <Sparkles className="w-5 h-5 opacity-60" style={{ color: BRAND_COLOR }} />
                        </div>

                        {/* Textarea */}
                        <textarea
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Initiate a query or send a command to the AI..."
                            className="w-full bg-transparent text-[16px] text-slate-700 placeholder:text-slate-400 focus:outline-none resize-none py-3 max-h-[120px] overflow-y-auto leading-relaxed"
                            style={{ height: '52px' }}
                            spellCheck={false}
                        />

                        {/* Send Button */}
                        <button
                            onClick={send}
                            disabled={!input.trim() || loading}
                            className={`w-11 h-11 flex items-center justify-center rounded-xl text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed mb-0.5 flex-shrink-0`}
                            style={{
                                background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, #908FE8 100%)`,
                                boxShadow: 'none'
                            }}
                        >
                            <Send size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Zen;
