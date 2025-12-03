import React from 'react';
import { ArrowRight, Globe, MessageSquare, Users } from 'lucide-react';
import logo from '../../assets/logo.svg';

const Logo = () => (
    <div className="flex items-center gap-3">
        <img src={logo} alt="ZenovaX Logo" className="w-38" />
    </div>
);

export default function Footer() {
    return (
        <footer className="mt-24 bg-[#0b0b1f] text-slate-400 py-16">
            <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-4 gap-10">
                <div>
                    <Logo />
                    <p className="mt-4 text-sm text-slate-500 max-w-xs">Advanced analytics to track, manage, and grow learning experiences.</p>
                    <div className="mt-6 flex">
                        <input
                            type="email"
                            placeholder="Subscribe for latest courses"
                            className="flex-1 px-4 py-3 rounded-l-2xl bg-[#141432] text-white text-sm placeholder:text-slate-500 border border-slate-700"
                        />
                        <button className="px-4 py-3 rounded-r-2xl bg-[#9190F8] text-white text-sm font-semibold">
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div>
                    <p className="text-sm font-semibold text-white mb-4">Quick Links</p>
                    <ul className="space-y-3 text-sm">
                        <li>Home</li>
                        <li>Dashboard</li>
                        <li>Pricing</li>
                        <li>About</li>
                        <li>Contact</li>
                    </ul>
                </div>
                <div>
                    <p className="text-sm font-semibold text-white mb-4">Resources</p>
                    <ul className="space-y-3 text-sm">
                        <li>Blog</li>
                        <li>Documentation</li>
                        <li>Help Center</li>
                        <li>Community</li>
                    </ul>
                </div>
                <div>
                    <p className="text-sm font-semibold text-white mb-4">Legal</p>
                    <ul className="space-y-3 text-sm">
                        <li>Privacy Policy</li>
                        <li>Terms of Service</li>
                        <li>Cookie Policy</li>
                        <li>Security</li>
                    </ul>
                </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 mt-12 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-sm">
                <p>© {new Date().getFullYear()} Skillify Learning Management. All rights reserved.</p>
                <div className="flex gap-3 text-slate-500">
                    <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:text-white">
                        <Globe className="w-4 h-4" />
                    </button>
                    <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:text-white">
                        <MessageSquare className="w-4 h-4" />
                    </button>
                    <button className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:text-white">
                        <Users className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </footer>
    );
}
