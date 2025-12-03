import React from 'react';

export default function CTASection({ handlePrimaryCTA }) {
    return (
        <section className="mt-24 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600">
            <div className="max-w-5xl mx-auto rounded-[40px] bg-gradient-to-r from-[#f2f0ff] to-[#e6f2ff] border border-white shadow-xl text-center p-12">
                <p className="text-[#9190F8] font-semibold">Enhance Learning With Powerful Data Insights</p>
                <h2 className="mt-4 text-3xl font-bold text-slate-900">Unlock growth with real-time analytics & smart insights</h2>
                <p className="mt-4 text-slate-500">
                    Simplify learning, maximize growth, and keep your teams aligned with every metric.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                    <button onClick={handlePrimaryCTA} className="px-6 py-3 rounded-2xl bg-[#9190F8] text-white font-semibold">
                        Try it free today
                    </button>
                    <button className="px-6 py-3 rounded-2xl border border-[#d4d6ff] text-[#9190F8] font-semibold">
                        Get dashboard tour
                    </button>
                </div>
            </div>
        </section>
    );
}
