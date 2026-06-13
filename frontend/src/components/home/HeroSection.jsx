import { lazy, Suspense, useLayoutEffect, useRef } from 'react';
import { Sparkles, PlayCircle, ArrowRight, ShieldCheck, Code2, QrCode } from 'lucide-react';
import dashboard from '../../assets/dashboard-mockup.png';
import { gsap } from '../../utils/gsapSetup';

// Three.js scene is code-split so it never blocks first paint.
const HeroCanvas = lazy(() => import('./HeroCanvas'));

const proofChips = [
  { icon: ShieldCheck, label: 'Double-booking safe reservations' },
  { icon: Code2, label: 'In-browser code sandbox' },
  { icon: QrCode, label: 'QR ticket entry for meetups' },
];

export default function HeroSection({ handlePrimaryCTA }) {
  const scope = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('[data-hero-stagger]', {
            y: 40,
            opacity: 0,
            duration: 0.9,
            stagger: 0.12,
          })
          .from(
            '[data-hero-mockup]',
            { y: 90, opacity: 0, scale: 0.96, duration: 1.1 },
            '-=0.5'
          );

        // Hero transforms organically as scrolling begins: the headline
        // block lifts and softens while the product centerpiece rises and
        // scales into focus, knitting the hero into the next section.
        gsap.to('[data-hero-copy]', {
          y: -60,
          opacity: 0.35,
          ease: 'none',
          scrollTrigger: {
            trigger: scope.current,
            start: 'top top',
            end: '60% top',
            scrub: true,
          },
        });

        gsap.fromTo(
          '[data-hero-mockup]',
          { scale: 0.97 },
          {
            scale: 1.02,
            y: -40,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-hero-mockup]',
              start: 'top 85%',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });
    }, scope);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="home"
      ref={scope}
      className="relative overflow-hidden bg-bg text-text"
    >
      <Suspense fallback={null}>
        <HeroCanvas />
      </Suspense>

      {/* Ambient gradient glows (token-driven, soft for the light theme) */}
      <div
        aria-hidden="true"
        className="absolute -top-44 left-1/2 -translate-x-1/2 h-[560px] w-[860px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'var(--color-glow)' }}
      />
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-[-200px] h-[420px] w-[420px] rounded-full blur-[130px] pointer-events-none"
        style={{ background: 'var(--color-glow-soft)' }}
      />

      <div className="relative max-w-6xl mx-auto px-6 pt-36 md:pt-44 pb-20 text-center">
        <div data-hero-copy className="will-change-transform">
          <span
            data-hero-stagger
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-strong bg-surface backdrop-blur text-xs font-semibold tracking-wide text-text-subtle uppercase shadow-[var(--shadow-sm)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            Peer-to-peer learning, engineered for speed
          </span>

          <h1
            data-hero-stagger
            className="mt-8 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] text-text"
          >
            Learn from peers who
            <br className="hidden md:block" />{' '}
            <span className="text-gradient">just cracked it</span>
          </h1>

          <p
            data-hero-stagger
            className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-text-muted leading-relaxed"
          >
            ZenovaX connects you with student mentors for focused, topic-wise
            sessions, free or paid. Reserve a seat, practice in a live code
            sandbox, and walk into campus meetups with a QR entry ticket.
          </p>

          <div data-hero-stagger className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={handlePrimaryCTA}
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-accent text-text-on-accent font-semibold text-base shadow-[var(--shadow-accent)] hover:-translate-y-0.5 hover:brightness-105 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Book a session
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
            <a
              href="#journey"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-border-strong text-text font-medium bg-surface hover:border-accent hover:bg-accent-tint transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <PlayCircle className="w-5 h-5 text-accent" aria-hidden="true" />
              How it works
            </a>
          </div>

          <ul data-hero-stagger className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 list-none">
            {proofChips.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-text-subtle">
                <Icon className="w-4 h-4 text-accent" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div data-hero-mockup className="relative mt-20 will-change-transform">
          <div
            aria-hidden="true"
            className="absolute -inset-x-8 -top-8 h-40 blur-2xl pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, var(--color-glow-soft), transparent)' }}
          />
          <img
            src={dashboard}
            width={1200}
            height={875}
            fetchpriority="high"
            alt="ZenovaX learner dashboard showing upcoming peer sessions and recommended mentors"
            className="relative w-full rounded-[28px] border border-border bg-surface shadow-[var(--shadow-lg)]"
          />
        </div>
      </div>
    </section>
  );
}
