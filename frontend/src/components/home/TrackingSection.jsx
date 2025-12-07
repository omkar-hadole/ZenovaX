import React from 'react';
import { CheckCircle, LineChart } from 'lucide-react';

const efficiencyCards = [
    {
        title: 'Clear Your Doubts Faster',
        description: 'Learn directly from peers who mastered the same topic recently.',
    },
    {
        title: 'Learn by Solving Together',
        description: 'Collaborative practice builds deeper understanding and speed.',
    },
    {
        title: 'Get Notes & Quizzes After Sessions',
        description: 'Continue learning with resources tailored to your topic.',
    },
    {
        title: 'Rate Mentors & Improve Learning Quality',
        description: 'Your feedback shapes better sessions for everyone.',
    },
];
export default function TrackingSection() {
    return (
        <section id="tracking" className="mt-24 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl lg:text-4xl font-bold">
                        Learn Faster With Real Peer Support
                    </h2>
                    <p className="text-slate-500">
                        Book topic-based sessions, solve doubts live, access resources, and improve together with honest mentor ratings.
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
                        <p className="text-sm text-slate-500">Upcoming Session</p>
                        <h3 className="mt-2 font-semibold text-slate-900">Math — Trigonometric Identities</h3>
                        <p className="mt-1 text-xs text-slate-500">Mentor: Aditi Sharma • Free Session</p>

                        <button className="mt-4 px-4 py-2 rounded-lg bg-[#9190F8] text-white text-sm font-semibold">
                            Join Session
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-[#eceafd] p-4">
                            <p className="text-xs text-slate-500">Resources</p>
                            <h3 className="text-lg font-semibold text-slate-900 mt-1">Notes + 5 Quizzes</h3>
                            <p className="text-xs text-slate-500">For your last session</p>
                        </div>
                        <div className="rounded-2xl border border-[#eceafd] p-4">
                            <p className="text-xs text-slate-500">Your Ratings</p>
                            <h3 className="text-lg font-semibold text-slate-900 mt-1">4.5⭐ Mentor Avg</h3>
                            <p className="text-xs text-slate-500">Based on 3 sessions</p>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
