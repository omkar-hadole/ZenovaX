import React from 'react';
import { CheckCircle, LineChart } from 'lucide-react';

const efficiencyCards = [
    {
        title: 'Boost Productivity',
        description: 'Stay on top of the day with smart reminders and nudges.',
    },
    {
        title: 'Stay Motivated',
        description: 'Visualize milestones with delightful progress cards.',
    },
    {
        title: 'Stay Organized & in Control',
        description: 'Juggling multiple classes feels effortless and calm.',
    },
    {
        title: 'Learn Anywhere',
        description: 'Switch from laptop to phone without missing a beat.',
    },
];

export default function TrackingSection() {
    return (
        <section id="tracking" className="mt-24 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl lg:text-4xl font-bold">Enhance Learning Efficiency with Smart Tracking & Flexibility</h2>
                    <p className="text-slate-500">
                        Optimize your learning experience with stacked analytics cards, flexible scheduling, and instant progress snapshots.
                    </p>
                    <div className="grid grid-cols-1 gap-5">
                        {efficiencyCards.map((card) => (
                            <div key={card.title} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#ededff] text-[#9190F8] flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">{card.title}</p>
                                    <p className="text-sm text-slate-500">{card.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-white rounded-[32px] border border-[#eceafd] p-8 space-y-6">
                    <div className="bg-[#f7f6ff] rounded-3xl p-6 border border-[#eceafd]">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                            <span>Hours Activity</span>
                            <span className="text-[#9190F8] font-semibold flex items-center gap-1">
                                <LineChart className="w-4 h-4" />
                                Weekly
                            </span>
                        </div>
                        <div className="mt-6 grid grid-cols-5 gap-3">
                            {[54, 72, 60, 86, 70].map((value, idx) => (
                                <div key={idx} className="bg-white rounded-2xl p-4 border border-[#eceafd] shadow-sm">
                                    <p className="text-xs text-slate-500">Day {idx + 1}</p>
                                    <p className="text-2xl font-semibold text-slate-900 mt-2">{value}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-[#eceafd] p-4">
                            <p className="text-xs text-slate-500">Achievements</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">24</h3>
                            <p className="text-xs text-slate-500">Badges earned</p>
                        </div>
                        <div className="rounded-2xl border border-[#eceafd] p-4">
                            <p className="text-xs text-slate-500">Study Time</p>
                            <h3 className="text-3xl font-bold text-slate-900 mt-2">156h</h3>
                            <p className="text-xs text-slate-500">This quarter</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
