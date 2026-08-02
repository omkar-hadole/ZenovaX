import React, { useState } from 'react';
import { MessageCircle, Mail, Phone, ExternalLink, ChevronDown, Sparkles, Search } from 'lucide-react';

const WA_LINK = "https://wa.me/919876543210";

const DEFAULT_CONTACTS = [
    {
        title: 'Email Support',
        value: 'support@zenovax.com',
        href: 'mailto:support@zenovax.com',
        detail: 'Detailed responses within 24–48 hours',
        icon: Mail,
        actionText: 'Email Us',
        accent: 'bg-accent/10 text-accent dark:bg-accent/15 dark:text-accent-soft',
    },
    {
        title: 'Call Support',
        value: '+91 987 654 3210',
        href: 'tel:+919876543210',
        detail: '10 AM – 6 PM IST only',
        icon: Phone,
        badge: 'Urgent',
        actionText: 'Call Now',
        accent: 'bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400',
    },
];

function FaqItem({ faq, isOpen, onToggle }) {
    return (
        <div
            className={`rounded-2xl overflow-hidden bg-white dark:bg-gray-900/70 border transition-all duration-300 ${
                isOpen
                    ? 'border-accent/30 dark:border-accent/40 shadow-md shadow-accent/5'
                    : 'border-border dark:border-gray-800 hover:border-accent/30 hover:shadow-sm'
            }`}
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between gap-4 p-5 text-left transition-colors"
            >
                <span className="font-semibold text-slate-900 dark:text-gray-100">{faq.q}</span>
                <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        isOpen ? 'bg-accent border-accent text-white rotate-180' : 'border-border text-gray-400'
                    }`}
                >
                    <ChevronDown className="w-4 h-4" />
                </span>
            </button>
            <div
                className="grid transition-all duration-300 ease-in-out"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
                        {faq.a}
                    </p>
                </div>
            </div>
        </div>
    );
}

const HelpCenter = ({
    subtitle,
    whatsappText,
    faqs,
    links = DEFAULT_CONTACTS,
    tips,
}) => {
    const [openKey, setOpenKey] = useState(null);
    const [query, setQuery] = useState('');

    const filtered = faqs.filter(
        faq =>
            !query ||
            faq.q.toLowerCase().includes(query.toLowerCase()) ||
            faq.a.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <div className="p-4 sm:p-6 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <header className="relative mb-6 text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-gray-50 mb-2">
                    Help <span className="text-gradient">Center</span>
                </h1>
                <p className="text-slate-600 dark:text-gray-400 max-w-xl">{subtitle}</p>
            </header>

            {/* WhatsApp Hero */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#128C7E] to-[#075E54] rounded-[2rem] p-8 text-white shadow-xl shadow-green-900/20 mb-6 group">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/15 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-16 -mb-16 blur-2xl" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                    <div className="flex items-start gap-5">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
                            <MessageCircle className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold mb-1.5">WhatsApp Support</h2>
                            <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-md">{whatsappText}</p>
                            <span className="inline-block mt-3 text-xs font-medium bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full">
                                Available 10 AM – 8 PM IST
                            </span>
                        </div>
                    </div>
                    <a
                        href={WA_LINK}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-white text-[#075E54] px-7 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        Chat with Support <ExternalLink size={18} />
                    </a>
                </div>
            </div>

            {/* Contact + Quick Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Contact cards */}
                <div className="grid grid-cols-1 lg:col-span-2 gap-4 auto-rows-fr">
                    {links.map(contact => (
                        <a
                            key={contact.title}
                            href={contact.href}
                            className="group relative overflow-hidden bg-white dark:bg-gray-900/70 rounded-2xl p-8 border border-border dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 h-full"
                        >
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className={`relative w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center ${contact.accent}`}>
                                <contact.icon className="w-6 h-6" />
                            </div>
                            <div className="relative flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-base text-slate-900 dark:text-gray-100">{contact.title}</h3>
                                    {contact.badge && (
                                        <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                            {contact.badge}
                                        </span>
                                    )}
                                </div>
                                <p className="text-accent font-semibold text-sm hover:underline truncate">{contact.value}</p>
                                <p className="text-xs text-slate-500 dark:text-gray-400">{contact.detail}</p>
                            </div>
                            <div className="relative flex items-center gap-1 ml-2 shrink-0 px-3 py-2 rounded-xl bg-[#F5F6FA] dark:bg-gray-800/70 text-slate-500 dark:text-gray-300 text-xs font-bold group-hover:bg-accent group-hover:text-white transition-colors duration-300">
                                {contact.actionText}
                            </div>
                        </a>
                    ))}
                </div>

                {/* Quick Tips */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#6361e0] via-[#7a79e6] to-[#9190f8] rounded-[2rem] p-8 text-white group">
                    <div className="absolute top-0 right-0 w-56 h-56 bg-white/15 rounded-full blur-3xl -mr-24 -mt-24" />
                    <div className="relative">
                        <h3 className="font-bold text-lg mb-5 flex items-center gap-2.5">
                            <div className="w-1.5 h-6 bg-white/40 rounded-full" />
                            Quick Tips
                        </h3>
                        <ul className="space-y-4 text-sm text-white/85">
                            {tips.map(tip => (
                                <li key={tip} className="flex items-start gap-3">
                                    <span className="w-5 h-5 mt-0.5 rounded-full bg-white/25 text-white flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-3 h-3" />
                                    </span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* FAQs */}
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100">
                        Frequently Asked Questions
                    </h2>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search questions..."
                        className="w-full bg-white dark:bg-gray-900/70 border border-border dark:border-gray-800 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-800 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                    />
                </div>

                <div className="space-y-3">
                    {filtered.length > 0 ? (
                        filtered.map(faq => (
                            <FaqItem
                                key={faq.q}
                                faq={faq}
                                isOpen={openKey === faq.q}
                                onToggle={() => setOpenKey(openKey === faq.q ? null : faq.q)}
                            />
                        ))
                    ) : (
                        <div className="bg-white dark:bg-gray-900/70 border border-dashed border-border rounded-2xl py-12 text-center">
                            <p className="text-slate-600 dark:text-gray-400 text-sm">No results for "{query}". Try a different keyword.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;