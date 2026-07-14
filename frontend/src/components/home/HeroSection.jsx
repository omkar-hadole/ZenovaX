import { lazy, Suspense, useLayoutEffect, useRef } from 'react';
import { Sparkles, PlayCircle, ArrowRight, ShieldCheck, Code2, QrCode } from 'lucide-react';
import dashboard from '../../assets/dashboard-mockup.webp';
import dashboardMobile from '../../assets/dashboard-mockup-800w.webp';
import { gsap } from '../../utils/gsapSetup';

// Three.js scene is code-split so it never blocks first paint.
const HeroCanvas = lazy(() => import('./HeroCanvas'));

const proofChips = [
  { icon: ShieldCheck, label: 'Double-booking safe reservations' },
  { icon: Code2, label: 'In-browser code sandbox' },
  { icon: QrCode, label: 'QR ticket entry for meetups' },
];

// Headline words, split so each can rise out of its own overflow-hidden mask.
const HEADLINE_WORDS = ['Learn', 'from', 'peers', 'who'];
const ACCENT_WORDS = ['just', 'cracked', 'it'];

function MaskedWord({ children, accent = false }) {
  return (
    <span className="inline-block overflow-hidden align-bottom pb-2 -mb-2">
      <span
        data-hero-word
        className={`inline-block will-change-transform ${accent ? 'text-gradient text-shimmer' : ''}`}
      >
        {children}
      </span>
    </span>
  );
}

export default function HeroSection({ handlePrimaryCTA }) {
  const scope = useRef(null);
  const tiltRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('[data-hero-word]', {
            yPercent: 115,
            duration: 0.9,
            ease: 'power4.out',
            stagger: 0.07,
          })
          .from(
            '[data-hero-stagger]',
            {
              y: 40,
              opacity: 0,
              duration: 0.9,
              stagger: 0.12,
            },
            '-=0.55'
          )
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

      // Gentle pointer-driven 3D tilt on the mockup — mouse users only, and
      // applied to an inner wrapper so it never fights the scroll-scrub
      // scale/translate on [data-hero-mockup] above.
      mm.add(
        '(prefers-reduced-motion: no-preference) and (pointer: fine)',
        () => {
          const el = tiltRef.current;
          if (!el) return;
          const zone = el.parentElement;
          const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
          const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });

          const onMove = (e) => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            rotY(px * 6);
            rotX(-py * 5);
          };
          const onLeave = () => {
            rotX(0);
            rotY(0);
          };
          zone.addEventListener('pointermove', onMove, { passive: true });
          zone.addEventListener('pointerleave', onLeave);
          return () => {
            zone.removeEventListener('pointermove', onMove);
            zone.removeEventListener('pointerleave', onLeave);
          };
        }
      );
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
            className="mt-8 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05] text-text"
            aria-label="Learn from peers who just cracked it"
          >
            <span aria-hidden="true">
              {HEADLINE_WORDS.map((word) => (
                <span key={word}>
                  <MaskedWord>{word}</MaskedWord>{' '}
                </span>
              ))}
              <br className="hidden md:block" />
              {ACCENT_WORDS.map((word, i) => (
                <span key={word}>
                  <MaskedWord accent>{word}</MaskedWord>
                  {i < ACCENT_WORDS.length - 1 ? ' ' : ''}
                </span>
              ))}
            </span>
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

        <div
          data-hero-mockup
          className="relative mt-20 will-change-transform"
          style={{ perspective: '1200px' }}
        >
          <div
            aria-hidden="true"
            className="absolute -inset-x-8 -top-8 h-40 blur-2xl pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, var(--color-glow-soft), transparent)' }}
          />
          <div ref={tiltRef} className="will-change-transform [transform-style:preserve-3d]">
            <img
              src={dashboard}
              srcSet={`${dashboardMobile} 800w, ${dashboard} 2389w`}
              sizes="(max-width: 768px) 100vw, 1152px"
              width={1200}
              height={875}
              fetchPriority="high"
              alt="ZenovaX learner dashboard showing upcoming peer sessions and recommended mentors"
              className="relative w-full rounded-[28px] border border-border bg-surface shadow-[var(--shadow-lg)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
