import React from 'react';
import { Sparkles, CheckCircle, PlayCircle } from 'lucide-react';
import dashboard from '../../assets/dashboard-mockup.png';
import bg from '../../assets/bg.png';

export default function HeroSection({ handlePrimaryCTA }) {
    return (
        <section
            className="relative px-4 pt-40 border-b border-[#e2e0ff] animate-in fade-in duration-700"
            style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: "cover",
                backgroundPosition: "top center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="absolute inset-0 pointer-events-none opacity-50"></div>

            <div className="max-w-6xl mx-auto">
                <div className="text-center space-y-10 mb-20">

                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-[#e2e0ff] text-xs text-slate-700 font-semibold shadow-sm">
                        <Sparkles className="w-3 h-3" />
                        Peer-Based Learning
                    </span>

                    <h1 className="text-4xl lg:text-7xl font-semibold leading-tight text-slate-900">
                        <span className="text-[#7a79e6]">ZenovaX</span> — Learn Faster
                        <br className="hidden md:block" /> with Real Peer Sessions
                    </h1>


                    <div className="flex flex-wrap justify-center gap-6 text-base text-slate-600 font-normal">
                        {[
                            "Custom sessions for any topic",
                            "Learn from peers instantly",
                            "Track progress & improve"
                        ].map((item) => (
                            <div key={item} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-[#6967e6]" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-wrap justify-center gap-6">
                        <button
                            onClick={handlePrimaryCTA}
                            className="px-8 py-3 rounded-4xl bg-[#9190F8] text-white font-medium hover:bg-[#5957e6] transition"
                        >
                            Book a Session
                        </button>

                        <button className="px-8 py-3 rounded-4xl border border-[#d4d6ff] text-[#7a79e6] font-medium flex items-center gap-2 bg-white hover:bg-[#fafaff] transition">
                            <PlayCircle className="w-5 h-5" />
                            How It Works
                        </button>
                    </div>
                </div>

                <div className="flex justify-center mt-16">
                    <div className="w-full max-w-8xl">
                        <img
                            src={dashboard}
                            width={1200}
                            height={875}
                            fetchpriority="high"
                            alt="ZenovaX peer learning dashboard preview"
                            className="w-full rounded-[32px] shadow-2xl border border-[#eceafd] rounded-b-[0px]"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}