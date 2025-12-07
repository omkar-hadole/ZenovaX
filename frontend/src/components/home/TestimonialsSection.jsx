import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
    {
        quote:
            '“I understood Python loops finally after a peer session. The mentor even shared practice questions right after.”',
        name: 'Ishaan T.',
        role: '1st Year • AI & ML',
        color: 'bg-[#dfe2ff]',
    },
    {
        quote:
            '“Learning UI basics from a senior who actually designs daily just hits differently. Got feedback on my project too.”',
        name: 'Megha S.',
        role: '2nd Year • Design',
        color: 'bg-[#f4e9ff]',
    },
    {
        quote:
            '“Recursion confused me for weeks. Solving problems together made it so simple. We debugged code live!”',
        name: 'Aditya R.',
        role: '1st Year • CS (Data Science)',
        color: 'bg-[#ffeeda]',
    },
];

export default function TestimonialsSection() {
    return (
        <section id="testimonials" className="mt-24 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
            <div className="max-w-6xl mx-auto text-center">
                <p className="text-[#9190F8] font-semibold">Students Who Tried ZenovaX</p>
                <h2 className="text-3xl lg:text-4xl font-bold mt-2">Real Learning. Real Results.</h2>
                <div className="mt-12 grid md:grid-cols-3 gap-6">
                    {testimonials.map((item) => (
                        <div key={item.name} className={`rounded-[28px] border border-[#eceafd] ${item.color} p-8 text-left shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300`}>
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, idx) => (
                                    <Star key={idx} className="w-4 h-4 fill-[#ffb347] text-[#ffb347]" />
                                ))}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{item.quote}</p>
                            <div className="mt-6 border-l-4 border-[#9190F8] pl-3">
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
