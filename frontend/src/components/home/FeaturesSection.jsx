import { useLayoutEffect, useRef } from 'react';
import { Users, Code2, Lock, QrCode, Bot, Trophy } from 'lucide-react';
import { gsap, ScrollTrigger } from '../../utils/gsapSetup';

const features = [
  {
    icon: Code2,
    kicker: 'Practice, not playback',
    title: 'In-browser code sandbox',
    body: 'A Monaco-powered playground with resizable panels and run shortcuts. JavaScript executes instantly in your browser; Python and Java run in isolated sandbox containers.',
  },
  {
    icon: Lock,
    kicker: 'Transaction-safe',
    title: 'Double-booking safe seats',
    body: 'Seat reservations flow through a BullMQ queue guarded by a Redis distributed lock, so high-demand sessions never overbook — even under a rush.',
  },
  {
    icon: QrCode,
    kicker: 'Online meets offline',
    title: 'QR ticket attendance',
    body: 'Offline meetups generate secure QR entry tickets. Mentors scan them with a phone camera and attendance updates in real time.',
  },
  {
    icon: Bot,
    kicker: 'Deterministic by design',
    title: 'Zen, the AI help desk',
    body: 'A Gemini-powered assistant constrained strictly to platform documentation, so answers about policies and bookings stay accurate — never hallucinated.',
  },
  {
    icon: Users,
    kicker: 'Human, focused',
    title: 'Topic-wise peer sessions',
    body: 'Sessions like \u201CAdvanced React Patterns\u201D or \u201CReverse a Linked List\u201D, led by peers who recently mastered them. Free or paid, online or on campus.',
  },
  {
    icon: Trophy,
    kicker: 'Earn your status',
    title: 'Gamified mentorship',
    body: 'Ratings, points, and badges from Bronze to Verified turn teaching into a public, verifiable portfolio of achievements.',
  },
];

export default function FeaturesSection() {
  const scope = useRef(null);
  const trackRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Desktop + motion allowed: pin the section and scroll the track
      // horizontally, mapping vertical scroll distance to the panels.
      mm.add(
        '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
        () => {
          const track = trackRef.current;
          if (!track) return;
          const getScroll = () => track.scrollWidth - window.innerWidth;

          const tween = gsap.to(track, {
            x: () => -getScroll(),
            ease: 'none',
            scrollTrigger: {
              trigger: scope.current,
              start: 'top top',
              end: () => `+=${getScroll()}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // Progress bar tracks horizontal advance.
          gsap.to('[data-feat-progress]', {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: scope.current,
              start: 'top top',
              end: () => `+=${getScroll()}`,
              scrub: true,
            },
          });

          // Subtle progressive reveal of each panel as it enters view.
          gsap.utils.toArray('[data-feat-card]').forEach((card) => {
            gsap.from(card, {
              opacity: 0,
              y: 40,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                containerAnimation: tween,
                start: 'left 85%',
                once: true,
              },
            });
          });
        }
      );

      ScrollTrigger.refresh();
    }, scope);
    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={scope} className="relative bg-bg-subtle overflow-hidden">
      <div className="relative md:h-screen flex flex-col justify-center py-20 md:py-0">
        <div className="max-w-6xl mx-auto px-6 w-full">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-widest uppercase text-accent">
              Why ZenovaX
            </p>
            <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-text">
              Not another video library.
              <span className="text-text-subtle"> An ecosystem built for doing.</span>
            </h2>
            <p className="mt-5 text-lg text-text-muted leading-relaxed">
              Scroll across the capabilities that make peer learning stick —
              real-time practice, transaction-safe bookings, and verified
              mentorship, all in one place.
            </p>
          </div>

          {/* Horizontal progress indicator (desktop) */}
          <div className="hidden md:block mt-10 h-1 w-40 rounded-full bg-border overflow-hidden">
            <div
              data-feat-progress
              className="h-full w-full origin-left scale-x-0 bg-gradient-accent rounded-full"
            />
          </div>
        </div>

        {/* Track: horizontal on desktop, vertical stack on mobile / reduced motion */}
        <div
          ref={trackRef}
          className="mt-10 md:mt-12 flex flex-col md:flex-row gap-6 md:gap-8 px-6 md:px-[max(1.5rem,calc((100vw-72rem)/2))] md:w-max md:items-stretch will-change-transform"
        >
          {features.map(({ icon: Icon, kicker, title, body }, i) => (
            <article
              key={title}
              data-feat-card
              className="group relative md:w-[clamp(20rem,32vw,26rem)] rounded-3xl border border-border bg-surface p-8 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-border-accent transition-all duration-300 overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl transition-all duration-500 group-hover:scale-125"
                style={{ background: 'var(--color-accent-tint)' }}
              />
              <div className="relative">
                <span aria-hidden="true" className="text-7xl font-semibold text-border-strong/60 leading-none select-none">
                  0{i + 1}
                </span>
                <div className="mt-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-tint border border-border-accent">
                  <Icon className="w-5 h-5 text-accent" aria-hidden="true" />
                </div>
                <p className="mt-5 text-xs font-semibold tracking-widest uppercase text-accent">
                  {kicker}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-text">{title}</h3>
                <p className="mt-3 text-text-muted leading-relaxed">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
