import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection({ handlePrimaryCTA }) {
  return (
    <section className="relative bg-bg pb-28 pt-4">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[32px] border border-border bg-surface-invert px-8 py-20 md:py-24 text-center"
        >
          <div
            aria-hidden="true"
            className="absolute -top-32 left-1/2 -translate-x-1/2 h-72 w-[640px] rounded-full blur-[120px] pointer-events-none"
            style={{ background: 'var(--color-glow)' }}
          />
          <div className="relative">
<h2 className="text-4xl md:text-6xl font-semibold tracking-tight text-text-on-invert leading-tight">
              Stop watching tutorials.
              <br />
              <span className="text-gradient">Start solving with peers.</span>
            </h2>
            <p className="mt-6 max-w-xl mx-auto text-lg text-text-on-invert/70">
              Your next <span className="italic">aha</span> moment is one session
              away — and it might come from someone who sits three rows behind
              you in class.
            </p>
            <div className="mt-10 flex justify-center">
              <button
                onClick={handlePrimaryCTA}
                className="group inline-flex items-center gap-2 px-9 py-4 rounded-full bg-gradient-accent text-text-on-accent font-semibold text-lg shadow-[var(--shadow-accent)] hover:-translate-y-0.5 hover:brightness-105 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
