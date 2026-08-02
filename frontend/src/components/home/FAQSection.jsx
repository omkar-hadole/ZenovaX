import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const faqs = [
  {
    q: 'Is ZenovaX only for coding subjects?',
    a: 'No — any subject where a student can teach another student works. Coding just has extra tooling (a live code editor, test cases, and AI help) because it benefits from it most.',
  },
  {
    q: 'Do I have to pay for sessions?',
    a: 'Not always. Mentors choose whether their session is free or paid, and you can filter by price when browsing.',
  },
  {
    q: 'Who can become a mentor?',
    a: 'Any student confident enough in a topic to teach it. You’ll set up a mentor profile with your skills, department, and year before your first session.',
  },
  {
    q: 'What if a mentor doesn’t show up, or a session isn’t what I expected?',
    a: 'Every session has a “Report an issue” option, and our support team reviews it — plus you can leave an honest (even anonymous) review afterward.',
  },
  {
    q: 'How do mentors get paid?',
    a: 'Earnings from paid sessions go into your ZenovaX balance once the session is marked complete, and you can withdraw to your UPI account anytime after verification.',
  },
  {
    q: 'What is Zen AI?',
    a: 'Your personal assistant inside ZenovaX — accessible anywhere with Cmd+K. It knows your sessions and progress, and can also just answer general questions when you’re stuck on something.',
  },
  {
    q: 'Is my information safe?',
    a: 'Yes. You control what’s visible on your profile — including whether your phone number is shown to other students — from your privacy settings.',
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="relative bg-bg py-28">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-accent">FAQ</p>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-text">
            Questions, answered.
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`rounded-2xl border transition-colors ${
                  isOpen
                    ? 'border-border-accent bg-surface shadow-[var(--shadow-sm)]'
                    : 'border-border bg-surface-2'
                }`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-2xl"
                >
                  <span className="font-medium text-text">{item.q}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`w-5 h-5 flex-shrink-0 text-accent transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-text-muted leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
