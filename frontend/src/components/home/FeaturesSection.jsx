import { useLayoutEffect, useRef } from 'react';
import { Users, BookOpenCheck, Tag, Bot, Code2, Star, Wallet } from 'lucide-react';
import { gsap, ScrollTrigger } from '../../utils/gsapSetup';

const features = [
  {
    icon: Users,
    kicker: 'Learn from peers, not just professors',
    title: 'An instructor like you',
    body: 'Book a session with a senior or classmate who’s already mastered the topic — someone your age, who explains it the way you’d actually understand it.',
  },
  {
    icon: BookOpenCheck,
    kicker: 'Sessions built for real doubts',
    title: 'Resources, quizzes & coding',
    body: 'Every session comes with resources, a quiz, and coding questions attached — so you’re not just watching, you’re actually testing what you know.',
  },
  {
    icon: Tag,
    kicker: 'Free or affordable, your choice',
    title: 'Priced for students',
    body: 'Mentors set their own price — many sessions are free, and paid ones are priced for students, not against them.',
  },
  {
    icon: Bot,
    kicker: 'Zen AI, on standby',
    title: 'Help knows your progress',
    body: 'Stuck at 1 AM before an exam? Hit Cmd+K and ask Zen AI — it knows your sessions, your progress, and can help with anything else on your mind too.',
  },
  {
    icon: Code2,
    kicker: 'Code, get instant feedback',
    title: 'Live sandbox, instant feedback',
    body: 'Solve real coding questions in a live sandbox with test cases, XP, and an AI that already knows what you’re working on — no separate tab, no context switching.',
  },
  {
    icon: Star,
    kicker: 'Ratings you can trust',
    title: 'Honest, anonymous reviews',
    body: 'Every mentor is rated by real students — with an option to review anonymously, so feedback stays honest.',
  },
  {
    icon: Wallet,
    kicker: 'Built for mentors too',
    title: 'Teaching pays, literally',
    body: 'Mentors earn from every session, track their earnings, and build a reputation with badges and followers as they go.',
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
          // Scrubbed (not one-shot) so cards already inside the viewport at
          // pin start resolve to their correct visible state immediately —
          // `once: true` triggers here left every card stuck at opacity 0
          // until the container tween happened to re-evaluate them.
          gsap.utils.toArray('[data-feat-card]').forEach((card) => {
            gsap.fromTo(
              card,
              { opacity: 0, y: 40 },
              {
                opacity: 1,
                y: 0,
                ease: 'power2.out',
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: tween,
                  start: 'left 95%',
                  end: 'left 65%',
                  scrub: true,
                },
              }
            );
          });
        }
      );

      ScrollTrigger.refresh();
    }, scope);

    // The horizontal scroll distance depends on the rendered track width,
    // which can grow once webfonts and images load. Re-measure then, so the
    // pinned scroll reaches the very last feature card.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready?.then(refresh);
    window.addEventListener('load', refresh);

    return () => {
      ctx.revert();
      window.removeEventListener('load', refresh);
    };
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
