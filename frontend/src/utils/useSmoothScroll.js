import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsapSetup';

/**
 * Premium smooth scrolling via Lenis, wired into the GSAP ticker so
 * ScrollTrigger pinning / horizontal sections stay perfectly in sync.
 *
 * Fully respects prefers-reduced-motion: when reduced motion is
 * requested we skip Lenis entirely and leave native scrolling intact,
 * keeping all content visible and usable.
 *
 * Returns nothing; manages its own lifecycle for the page lifetime.
 */
export default function useSmoothScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) return undefined;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    // Keep ScrollTrigger aware of Lenis-driven scroll positions.
    lenis.on('scroll', ScrollTrigger.update);

    const raf = (time) => {
      // GSAP ticker delivers seconds; Lenis expects milliseconds.
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Smooth-scroll same-page anchor links (nav menu, footer).
    const onAnchorClick = (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -90 });
    };
    document.addEventListener('click', onAnchorClick);

    return () => {
      document.removeEventListener('click', onAnchorClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);
}
