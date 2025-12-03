import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
    {
        quote:
            '“This dashboard has completely transformed how my team manages their data. The insights are clear, detailed, and actionable.”',
        name: 'Richard M.',
        role: 'EdTech Director',
        color: 'bg-[#dfe2ff]',
    },
    {
        quote:
            '“Using this dashboard has been a game-changer for my team. A clean interface with powerful analytics.”',
        name: 'Sarah K.',
        role: 'Marketing Manager',
        color: 'bg-[#f4e9ff]',
    },
    {
        quote:
            '“The real-time analytics tools, the smart scheduling, and the insights keep us consistently on top.”',
        name: 'Michael S.',
        role: 'Customer Experience',
        color: 'bg-[#ffeeda]',
    },
];

export default function TestimonialsSection() {
    return (
        <section id="testimonials" className="mt-24 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            <div className="max-w-6xl mx-auto text-center">
                <p className="text-[#9190F8] font-semibold">Sweet Words from Our Customers</p>
                <h2 className="text-3xl lg:text-4xl font-bold mt-2">Real teams speak</h2>
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    {testimonials.map((item) => (
                        <div key={item.name} className={`rounded-[28px] border border-[#eceafd] ${item.color} p-8 text-left shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300`}>
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, idx) => (
                                    <Star key={idx} className="w-4 h-4 fill-[#ffb347] text-[#ffb347]" />
                                ))}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{item.quote}</p>
                            <div className="mt-6">
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <p className="text-xs text-slate-500">{item.role}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
