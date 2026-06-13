import { useLayoutEffect, useRef } from 'react';
import { Search, Ticket, QrCode, Presentation, Code2, Star } from 'lucide-react';
import { gsap } from '../../utils/gsapSetup';

const steps = [
  {
    icon: Search,
    title: 'Browse and filter',
    body: 'Find sessions by topic, level, price, or mentor on your dashboard.',
  },
  {
    icon: Ticket,
    title: 'Reserve your seat',
    body: 'A queued, lock-protected transaction confirms your booking instantly, with no double-booking races.',
  },
  {
    icon: QrCode,
    title: 'Get your QR ticket',
    body: 'Offline meetups generate a downloadable entry pass with a secure QR code.',
  },
  {
    icon: Presentation,
    title: 'Attend the session',
    body: 'Join live online or show your ticket on campus. Mentors verify entry with a quick scan.',
  },
  {
    icon: Code2,
    title: 'Practice immediately',
    body: 'Reinforce concepts with quizzes and coding challenges in the built-in Monaco sandbox.',
  },
  {
    icon: Star,
    title: 'Rate and grow',
    body: 'Review your mentor after attending. Great mentors earn points and unlock verified badges.',
  },
];

export default function TrackingSection() {
  const scope = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '[data-journey-line]',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            transformOrigin: 'top center',
            scrollTrigger: {
              trigger: scope.current,
              start: 'top 55%',
              end: 'bottom 75%',
              scrub: true,
            },
          }
        );
        gsap.utils.toArray('[data-step]').forEach((el) => {
          gsap.fromTo(
            el,
            { x: -32, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.7,
              ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 82%', once: true },
            }
          );
        });
      });
    }, scope);
    return () => ctx.revert();
  }, []);

  return (
    <section id="journey" ref={scope} className="relative bg-bg py-28 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-1/3 -left-40 h-[420px] w-[420px] rounded-full blur-[130px] pointer-events-none"
        style={{ background: 'var(--color-glow-soft)' }}
      />
      <div className="relative max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="lg:sticky lg:top-32 self-start">
          <p className="text-sm font-semibold tracking-widest uppercase text-accent">
            The learner journey
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-text">
            From stuck to solved,
            <span className="text-text-subtle"> in six steps.</span>
          </h2>
          <p className="mt-5 text-lg text-text-muted leading-relaxed max-w-md">
            Every booking flows through a transaction-safe pipeline, from
            discovery to attendance to hands-on practice, so you can focus on
            learning instead of logistics.
          </p>
        </div>

        <ol className="relative list-none space-y-10">
          <div
            aria-hidden="true"
            data-journey-line
            className="absolute left-[22px] top-2 bottom-2 w-px"
            style={{ background: 'linear-gradient(to bottom, var(--color-accent), var(--color-accent-soft), transparent)' }}
          />
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} data-step className="relative flex gap-6">
              <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-full bg-surface border border-border-accent shadow-[var(--shadow-sm)]">
                <Icon className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-semibold text-text">
                  <span className="text-text-subtle font-mono text-sm mr-2">0{i + 1}</span>
                  {title}
                </h3>
                <p className="mt-2 text-text-muted leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
