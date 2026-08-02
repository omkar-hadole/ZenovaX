import { useLayoutEffect, useRef } from 'react';
import { UserPlus, Search, Lightbulb, Star } from 'lucide-react';
import { gsap } from '../../utils/gsapSetup';

const steps = [
  {
    icon: UserPlus,
    title: 'Create your account',
    body: 'Sign up, verify your email, and tell us if you’re here to learn or here to teach.',
  },
  {
    icon: Search,
    title: 'Find your session',
    body: 'Browse by topic, department, price, or mode — online or in person — and pick what fits.',
  },
  {
    icon: Lightbulb,
    title: 'Learn, solve, and ask',
    body: 'Attend the session, work through the attached quiz or coding challenge, and ask Zen AI whenever you’re stuck.',
  },
  {
    icon: Star,
    title: 'Rate and come back',
    body: 'Leave a review, follow mentors you liked, and keep building your own learning streak.',
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
            How it works
          </p>
          <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-text">
            From first sign-up
            <span className="text-text-subtle"> to your next aha.</span>
          </h2>
          <p className="mt-5 text-lg text-text-muted leading-relaxed max-w-md">
            Four steps stand between you and finally getting it — no formality,
            no front, just learning from people who’ve been in your seat.
          </p>
        </div>

        <div>
          <ol className="relative list-none space-y-10">
            <div
              aria-hidden="true"
              data-journey-line
              className="absolute left-[14px] top-2 bottom-2 w-px"
              style={{ background: 'linear-gradient(to bottom, var(--color-accent), var(--color-accent-soft), transparent)' }}
            />
            {steps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} data-step className="relative flex gap-6">
                <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-surface border border-border-accent shadow-[var(--shadow-sm)]">
                  <Icon className="w-4 h-4 text-accent" aria-hidden="true" />
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

          <p
            data-step
            className="mt-10 rounded-2xl border border-border-soft bg-accent-tint p-5 text-sm text-text leading-relaxed"
          >
            <span className="font-semibold text-text">Mentor?</span> You take
            the same first two steps — then create a session, set your price,
            and go live. You get paid directly to your UPI once the session
            wraps up.
          </p>
        </div>
      </div>
    </section>
  );
}
