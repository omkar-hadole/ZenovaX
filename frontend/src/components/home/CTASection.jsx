import React from 'react';

export default function CTASection({ handlePrimaryCTA }) {
    return (
        <section className="mt-24 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600">
            <div className="max-w-5xl mx-auto rounded-[40px] bg-gradient-to-r from-[#f5f0ff] to-[#e6faff] border border-white shadow-xl text-center p-12">
                
                <p className="text-[#9190F8] font-semibold">
                    Peer-to-Peer Sessions. Real Learning.
                </p>

                <h2 className="mt-4 text-3xl font-bold text-slate-900">
                    Start Learning Together With Verified Student Mentors
                </h2>

                <p className="mt-4 text-slate-500">
                    Book free or paid sessions, solve topics live, access resources, and track progress through quizzes — all in one platform.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <button 
                        onClick={handlePrimaryCTA} 
                        className="px-6 py-3 rounded-2xl bg-[#9190F8] text-white font-semibold"
                    >
                        Book Your First Session
                    </button>
                    
                    <button className="px-6 py-3 rounded-2xl border border-[#d4d6ff] text-[#9190F8] font-semibold">
                        Browse Mentors
                    </button>
                </div>
            </div>
        </section>
    );
}