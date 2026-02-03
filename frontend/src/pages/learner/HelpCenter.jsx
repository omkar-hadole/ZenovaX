import React from 'react';
import { MessageCircle, Phone, Mail, ExternalLink, HelpCircle } from 'lucide-react';

const WA_LINK = "https://wa.me/919876543210";

const HelpCenter = () => {
    return (
        <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="text-center space-y-2 mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3">
                    <HelpCircle className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">Connect with our support team for assistance</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
                {/* WhatsApp - Primary */}
                <div className="bg-green-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                        <MessageCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">WhatsApp Support</h3>
                    <p className="text-green-100 text-base mb-6 leading-relaxed">
                        Get instant help from our team. Available 10 AM – 8 PM IST.
                    </p>
                    <a
                        href={WA_LINK}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                        Chat Now <ExternalLink size={18} />
                    </a>
                </div>

                {/* Other Contact Methods */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8 space-y-6">
                        {/* Email */}
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-lg mb-1">Email Support</h4>
                                <a href="mailto:support@zenovax.com" className="text-base text-blue-600 hover:underline block mb-1">
                                    support@zenovax.com
                                </a>
                                <p className="text-sm text-gray-500">Response in 24-48 hours</p>
                            </div>
                        </div>

                        <div className="h-px bg-gray-100"></div>

                        {/* Phone */}
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Phone className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900 text-lg">Call Support</h4>
                                    <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold uppercase">Urgent</span>
                                </div>
                                <p className="text-base text-gray-700 font-medium mb-1">+91 987 654 3210</p>
                                <p className="text-sm text-gray-500">10 AM - 6 PM IST only</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Tips */}
                <div className="bg-gray-900 rounded-2xl p-8 text-white">
                    <h4 className="font-bold text-lg mb-4">Quick Tips</h4>
                    <ul className="space-y-3 text-sm text-gray-300">
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-0.5 text-lg">•</span>
                            <span>For AI assistance, visit our Zen assistant from the sidebar</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-0.5 text-lg">•</span>
                            <span>Use WhatsApp for urgent issues and quick responses</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-blue-400 mt-0.5 text-lg">•</span>
                            <span>Email us for formal requests and detailed inquiries</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
