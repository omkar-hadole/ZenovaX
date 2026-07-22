import React, { useState } from 'react';
import { MessageCircle, Phone, Mail, ExternalLink, ChevronDown } from 'lucide-react';

const WA_LINK = "https://wa.me/919876543210";

const FAQS = [
    {
        q: 'How do I book a session?',
        a: 'Go to Browse Sessions, pick one that fits your schedule, and click Register. Free sessions confirm instantly; paid sessions confirm right after payment goes through.',
    },
    {
        q: 'Can I cancel or reschedule a booking?',
        a: "You can cancel from My Bookings up until the session starts. Rescheduling isn't automatic — reach out to your mentor or support and we'll help sort it out.",
    },
    {
        q: "I registered but the meeting link isn't working. What do I do?",
        a: 'The "Join Live Class" button only activates 15 minutes before the session starts — that\'s expected. If it still doesn\'t work once live, refresh the page first, then message us on WhatsApp for a fast fix.',
    },
    {
        q: 'How do refunds work for paid sessions?',
        a: "If a mentor cancels a paid session, you're refunded automatically. For other refund requests, email support@zenovax.com with your booking details and we'll review it within 24–48 hours.",
    },
    {
        q: 'How do I become a mentor on ZenovaX?',
        a: 'Complete your profile and submit a session request from the mentor dashboard. An admin reviews and approves it before it goes live to learners.',
    },
    {
        q: 'How do I change my password or account settings?',
        a: "Head to Settings from the sidebar — you can update your password, control your profile's phone number visibility, and manage your account from there.",
    },
];

function FaqItem({ faq, isOpen, onToggle }) {
    return (
        <div className={`border rounded-2xl overflow-hidden bg-white dark:bg-gray-900 transition-colors ${isOpen ? 'border-[#7a79e6]/30 dark:border-[#7a79e6]/40' : 'border-gray-100 dark:border-gray-800'}`}>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
            >
                <span className="font-bold text-slate-900 dark:text-gray-100">{faq.q}</span>
                <ChevronDown
                    className={`w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#7a79e6]' : ''}`}
                />
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

const HelpCenter = () => {
    const [openKey, setOpenKey] = useState(null);

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-gray-100 mb-2">Help Center</h1>
                <p className="text-slate-600 dark:text-gray-400">Connect with our support team for assistance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {/* WhatsApp - Primary */}
                <div className="md:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#128C7E] to-[#075E54] rounded-[2rem] p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all duration-500"></div>

                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                                <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-3xl font-bold mb-2">WhatsApp Support</h3>
                            <p className="text-green-50 text-base mb-8 leading-relaxed max-w-lg">
                                Get instant help from our team. We're online and ready to assist you directly on WhatsApp.
                                <br />
                                <span className="opacity-80 text-sm mt-2 block">Available 10 AM – 8 PM IST</span>
                            </p>
                        </div>
                        <div>
                            <a
                                href={WA_LINK}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 bg-white text-[#075E54] px-8 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all hover:-translate-y-1"
                            >
                                Chat with Support <ExternalLink size={18} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Quick Tips */}
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#7a79e6]/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <h4 className="font-bold text-xl mb-6 flex items-center gap-2">
                            <div className="w-1 h-6 bg-[#9190F8] rounded-full"></div>
                            Quick Tips
                        </h4>
                        <ul className="space-y-4 text-sm text-slate-300">
                            <li className="flex items-start gap-3">
                                <span className="text-[#9190F8] mt-0.5 text-lg">•</span>
                                <span>For instant AI assistance, try asking <strong>Zen</strong> in the sidebar — it's faster!</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-[#9190F8] mt-0.5 text-lg">•</span>
                                <span>Use WhatsApp for urgent issues that need human intervention.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-[#9190F8] mt-0.5 text-lg">•</span>
                                <span>Check the FAQs below before reaching out — most answers are already there.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Other Contact Methods */}
                <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-[#e2e0ff] dark:border-gray-800 overflow-hidden">
                    <div className="p-8 grid md:grid-cols-2 gap-8">
                        {/* Email */}
                        <div className="flex items-start gap-5 group">
                            <div className="w-14 h-14 bg-[#F5F6FA] dark:bg-gray-800/60 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#e2e0ff]/50 dark:group-hover:bg-gray-800 transition-colors duration-300">
                                <Mail className="w-6 h-6 text-[#7a79e6]" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 dark:text-gray-100 text-lg mb-1">Email Support</h4>
                                <a href="mailto:support@zenovax.com" className="text-base text-[#7a79e6] font-medium hover:underline block mb-1">
                                    support@zenovax.com
                                </a>
                                <p className="text-sm text-slate-500 dark:text-gray-400">Detailed responses within 24-48 hours</p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-start gap-5 group border-t md:border-t-0 md:border-l border-[#e2e0ff] dark:border-gray-800 pt-8 md:pt-0 md:pl-8">
                            <div className="w-14 h-14 bg-[#F5F6FA] dark:bg-gray-800/60 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#e2e0ff]/50 dark:group-hover:bg-gray-800 transition-colors duration-300">
                                <Phone className="w-6 h-6 text-[#7a79e6]" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-900 dark:text-gray-100 text-lg">Call Support</h4>
                                    <span className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Urgent</span>
                                </div>
                                <a href="tel:+919876543210" className="text-base text-slate-700 dark:text-gray-300 font-medium hover:text-[#7a79e6] dark:hover:text-[#9190F8] hover:underline block mb-1">
                                    +91 987 654 3210
                                </a>
                                <p className="text-sm text-slate-500 dark:text-gray-400">10 AM - 6 PM IST only</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQs */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-4">Frequently Asked Questions</h2>
                <div className="space-y-3">
                    {FAQS.map((faq) => (
                        <FaqItem
                            key={faq.q}
                            faq={faq}
                            isOpen={openKey === faq.q}
                            onToggle={() => setOpenKey(openKey === faq.q ? null : faq.q)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
