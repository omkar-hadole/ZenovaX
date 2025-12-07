import React from 'react';
import { BookOpen, Calendar, Globe } from 'lucide-react';

const featureCards = [
    {
        title: 'Book Peer Sessions (Free or Paid)',
        description: 'Choose mentors based on ratings and topic expertise. Learn through focused topic-based sessions.',
        accent: 'from-[#fff3e6] to-white',
        icon: BookOpen,
    },
    {
        title: 'Access Resources & Quizzes',
        description: 'Get curated notes, assignments, and quizzes after sessions to strengthen your understanding.',
        accent: 'from-[#e8ffef] to-white',
        icon: Globe,
    },
    {
        title: 'Rate & Review Your Mentor',
        description: 'Help improve the platform by rating the mentor’s teaching, clarity, and usefulness of the session.',
        accent: 'from-[#f3e8ff] to-white',
        icon: Calendar,
    },
];

export default function FeaturesSection() {
    return (
        <section id="features" className="mt-24 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="max-w-6xl mx-auto text-center">
                <div className='max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center'>
                    <h2 className="text-3xl lg:text-4xl font-bold mt-4 text-left">
                        Learn Faster With Real Peer Collaboration
                    </h2>
                    <p className="mt-3 text-slate-500 max-w-3xl mx-auto text-left">
                        Choose a topic, solve problems live with peers, and get actionable feedback and assignments tailored to your mistakes.
                    </p>
                </div>
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    {featureCards.map((card) => (
                        <div key={card.title} className={`rounded-[28px] border border-[#eceafd] bg-gradient-to-br ${card.accent} p-8 text-left hover:scale-[1.02] transition-transform duration-300 shadow-sm hover:shadow-lg`}>
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-inner flex items-center justify-center text-[#9190F8] mb-6">
                                <card.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900">{card.title}</h3>
                            <p className="mt-3 text-slate-500 text-sm leading-relaxed">{card.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
