import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqItems = [
    {
        question: 'Are peer sessions free or paid?',
        answer:
            'Both. Mentors can offer free or paid sessions depending on their expertise and availability. You choose based on ratings, topic, and price.',
    },
    {
        question: 'Who teaches in these sessions?',
        answer:
            'Sessions are led by verified student mentors who recently mastered the same topic. You learn directly from active learners, not random tutors.',
    },
    {
        question: 'What happens after a session?',
        answer:
            'You receive topic notes, practice questions, and quizzes (if offered by the mentor). You can also rate and review the mentor to improve quality.',
    },
    {
        question: 'How does rating and review help me?',
        answer:
            'Ratings help you choose better mentors. Reviews improve the teaching quality on the platform and reward mentors who deliver genuine value.',
    },
    {
        question: 'Is ZenovaX only for one subject?',
        answer:
            'No. You can learn multiple topics from different mentors. Subjects will expand over time based on student demand and mentor expertise.',
    },
];

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
    return (
        <div className="bg-white rounded-2xl border border-[#eceafd] overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
            >
                <span className="font-medium text-slate-800 pr-6">{question}</span>
                <ChevronDown
                    className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180 text-[#9190F8]' : ''}`}
                />
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <p className="px-6 pb-6 text-sm text-slate-500 leading-relaxed">{answer}</p>
            </div>
        </div>
    );
};

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState(0);

    const handleToggle = (idx) => {
        setOpenIndex((prevIndex) => (prevIndex === idx ? -1 : idx));
    };

    return (
        <section id="faq" className="mt-24 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
            <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl lg:text-4xl font-bold">Got Questions? We’ve Got Answers.</h2>
            </div>
            <div className="mt-10 max-w-4xl mx-auto space-y-4">
                {faqItems.map((item, idx) => (
                    <FAQItem
                        key={item.question}
                        question={item.question}
                        answer={item.answer}
                        isOpen={openIndex === idx}
                        onToggle={() => handleToggle(idx)}
                    />
                ))}
            </div>
        </section>
    );
}
