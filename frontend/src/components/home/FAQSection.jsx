import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const faqs = [
  {
    q: 'Are sessions free or paid?',
    a: 'Both. Mentors choose whether a session is free or paid when they propose it, and every session is reviewed by an admin before it appears in the public catalog.',
  },
  {
    q: 'How does the code sandbox run Python or Java safely?',
    a: 'Your code is forwarded to an isolated, short-lived sandbox container. It is wrapped server-side to capture output and trace exceptions, keeping execution fully secure. JavaScript runs instantly inside a sandboxed wrapper in your own browser.',
  },
  {
    q: 'Can I book the same session twice?',
    a: 'No. The booking system enforces a unique constraint per user and session, and a distributed lock queue prevents double-booking races even during high-demand seat rushes.',
  },
  {
    q: 'How does attendance work for offline meetups?',
    a: 'Confirmed bookings generate a printable entry ticket with a unique QR code. At the venue, the mentor scans it with their phone camera and your attendance is marked instantly.',
  },
  {
    q: 'When can I review a mentor?',
    a: 'Reviews unlock after the session has ended and your attendance has been marked, which keeps ratings honest and tied to real participation.',
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
