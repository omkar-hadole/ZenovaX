import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Phone, Mail, Bot, AlertTriangle, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const HelpCenter = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hi! I use the Help Center guide to answer questions about how ZenovaX works. How can I help?' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMessage = inputText;
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setInputText('');
        setIsLoading(true);

        try {
            // Updated to use the correct backend URL if needed or relative path with proxy
            // Assuming standard setup where frontend proxies to backend or using full URL
            let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            // Remove trailing slash and /api if present to normalize to base URL
            apiUrl = apiUrl.replace(/\/$/, "").replace(/\/api$/, "");

            const res = await axios.post(`${apiUrl}/api/help/ask-ai`, { question: userMessage });

            setMessages(prev => [...prev, { role: 'assistant', text: res.data.answer }]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', text: "I can’t help with this at the moment. Please contact WhatsApp support." }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Constants
    const WHATSAPP_NUMBER = "919876543210"; // Replace with actual number
    const SUPPORT_EMAIL = "support@zenovax.com";
    const SUPPORT_HOURS = "10 AM – 8 PM IST";

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-12 pb-20">
            {/* Header */}
            <div className="text-center space-y-3">
                <h1 className="text-3xl font-bold text-slate-900">Help Center</h1>
                <p className="text-slate-600">We're here to help you with your learning journey.</p>
            </div>

            {/* Section 1: WhatsApp (Primary) */}
            <div className="bg-green-50 rounded-2xl p-8 border border-green-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="space-y-3 text-center md:text-left">
                    <h2 className="text-xl font-bold text-green-800 flex items-center justify-center md:justify-start gap-2">
                        <MessageCircle className="w-6 h-6" />
                        Need help right now?
                    </h2>
                    <p className="text-green-700">
                        For specific issues, booking problems, or urgent help.
                    </p>
                    <p className="text-sm text-green-600 font-medium bg-green-100 inline-block px-3 py-1 rounded-full">
                        Available: {SUPPORT_HOURS}
                    </p>
                </div>
                <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition flex items-center gap-3 transform hover:scale-105"
                >
                    Chat on WhatsApp
                    <ExternalLink className="w-5 h-5" />
                </a>
            </div>

            {/* Section 2: Quick Answers AI (Secondary) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">Quick Answers (AI)</h3>
                            <p className="text-xs text-slate-500">Instant answers from our knowledge base</p>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="h-96 bg-slate-50/50 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`
                                    max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed prose prose-sm max-w-none
                                    ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none prose-invert'
                                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                                    }
                                `}
                            >
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm flex items-center gap-2">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Ask how sessions work, policies, etc..."
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !inputText.trim()}
                            className="bg-indigo-600 disabled:bg-indigo-300 text-white p-3 rounded-xl hover:bg-indigo-700 transition"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <div className="mt-2 flex justify-between items-center px-1">
                        <p className="text-xs text-slate-400">
                            AI can make mistakes. For strict policies, check Help Center or contact support.
                        </p>
                        {/* WhatsApp Button INSIDE AI Interface as requested by strict rules (fallback visibility) */}
                        <a
                            href={`https://wa.me/${WHATSAPP_NUMBER}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-green-600 hover:text-green-700 flex items-center gap-1"
                        >
                            <MessageCircle className="w-3 h-3" />
                            Contact WhatsApp Support
                        </a>
                    </div>
                </div>
            </div>

            {/* Section 3: Other ways to reach us */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-100 transition">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                        <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Email Support</h3>
                    <p className="text-slate-600 text-sm mb-4">
                        For formal requests, detailed queries, or refund receipts.
                    </p>
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 font-medium hover:underline text-sm">
                        {SUPPORT_EMAIL}
                    </a>
                    <p className="text-xs text-slate-400 mt-2">Response: 24-48 hours</p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-100 transition">
                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <Phone className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">Call Support</h3>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 mb-2">
                        EMERGENCY ONLY
                    </span>
                    <p className="text-slate-600 text-sm mb-4">
                        Only for critical issues where WhatsApp is not viable.
                    </p>
                    <p className="text-slate-800 font-medium text-sm">
                        +91 987 654 3210
                    </p>
                    <p className="text-xs text-slate-400 mt-2">Fixed Hours Only</p>
                </div>
            </div>

        </div>
    );
};

export default HelpCenter;
