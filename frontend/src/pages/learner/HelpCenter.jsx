import React from 'react';
import { MessageCircle, Phone, Mail, ExternalLink, HelpCircle } from 'lucide-react';

const WA_LINK = "https://wa.me/919876543210";

const HelpCenter = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto font-outfit animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-10 text-left">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Help Center</h1>
                <p className="text-slate-600">Connect with our support team for assistance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden flex flex-col">
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
                                <span>Check our FAQ section on the home page for common questions.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Other Contact Methods */}
                <div className="md:col-span-3 bg-white rounded-[2rem] shadow-sm border border-[#e2e0ff] overflow-hidden">
                    <div className="p-8 grid md:grid-cols-2 gap-8">
                        {/* Email */}
                        <div className="flex items-start gap-5 group">
                            <div className="w-14 h-14 bg-[#F5F6FA] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#e2e0ff]/50 transition-colors duration-300">
                                <Mail className="w-6 h-6 text-[#7a79e6]" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-900 text-lg mb-1">Email Support</h4>
                                <a href="mailto:support@zenovax.com" className="text-base text-[#7a79e6] font-medium hover:underline block mb-1">
                                    support@zenovax.com
                                </a>
                                <p className="text-sm text-slate-500">Detailed responses within 24-48 hours</p>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-start gap-5 group border-t md:border-t-0 md:border-l border-[#e2e0ff] pt-8 md:pt-0 md:pl-8">
                            <div className="w-14 h-14 bg-[#F5F6FA] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#e2e0ff]/50 transition-colors duration-300">
                                <Phone className="w-6 h-6 text-[#7a79e6]" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-900 text-lg">Call Support</h4>
                                    <span className="bg-red-50 text-red-600 border border-red-100 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Urgent</span>
                                </div>
                                <p className="text-base text-slate-700 font-medium mb-1">+91 987 654 3210</p>
                                <p className="text-sm text-slate-500">10 AM - 6 PM IST only</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
