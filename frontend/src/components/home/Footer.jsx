import React from 'react';
import { ArrowRight, Globe, MessageSquare, Users } from 'lucide-react';
import logo from '../../assets/footerlogo.svg';

const Logo = () => (
    <div className="flex items-center gap-3">
        <img
            src={logo}
            width={152}
            height={30}
            loading="lazy"
            alt="ZenovaX Logo"
            className="w-38"
        />
    </div>
);

export default function Footer() {
    return (
        <footer className="mt-24 bg-[#0b0b1f] text-slate-400 py-16">
            <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-4 gap-10">
                
                <div>
                    <Logo />
                    <p className="mt-4 text-sm text-slate-500 max-w-xs">
                        Learn smarter with real peer sessions, shared problem-solving, resources, and honest mentor reviews.
                    </p>
                    <div className="mt-6 flex">
                        <input
                            type="email"
                            placeholder="Get updates about new mentors"
                            className="flex-1 px-4 py-3 rounded-l-2xl bg-[#141432] text-white text-sm placeholder:text-slate-500 border border-slate-700"
                        />
                        <button className="px-4 py-3 rounded-r-2xl bg-[#9190F8] text-white text-sm font-semibold">
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div>
                    <p className="text-sm font-semibold text-white mb-4">Explore</p>
                    <ul className="space-y-3 text-sm">
                        <li>Home</li>
                        <li>Find Mentors</li>
                        <li>Book a Session</li>
                        <li>Resources</li>
                        <li>Quizzes</li>
                    </ul>
                </div>

                <div>
                    <p className="text-sm font-semibold text-white mb-4">Support</p>
                    <ul className="space-y-3 text-sm">
                        <li>How ZenovaX Works</li>
                        <li>Help Center</li>
                        <li>Student Community</li>
                        <li>Report a Mentor</li>
                    </ul>
                </div>

                <div>
                    <p className="text-sm font-semibold text-white mb-4">Legal</p>
                    <ul className="space-y-3 text-sm">
                        <li>Privacy Policy</li>
                        <li>Terms & Conditions</li>
                        <li>Refund Policy</li>
                        <li>Community Guidelines</li>
                    </ul>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 mt-12 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-sm">
                <p>© {new Date().getFullYear()} ZenovaX. All rights reserved.</p>
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