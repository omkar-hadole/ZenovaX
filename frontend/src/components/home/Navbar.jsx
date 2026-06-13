import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.svg';
import { getOptimizedImageUrl } from '../../utils/cloudinary';

export default function Navbar({ scrolled, isLoggedIn, handlePrimaryCTA }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'How it works', href: '#journey' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed top-4 left-0 right-0 z-50 flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: scrolled
            ? 'var(--nav-surface-scrolled)'
            : 'var(--nav-surface)',
          boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
        }}
        className={`
          w-[94%] md:w-[90%] lg:w-[82%] max-w-6xl
          rounded-2xl px-5 py-3 flex items-center justify-between
          border border-border backdrop-blur-xl transition-all duration-300
          ${scrolled ? 'border-border-strong' : ''}
        `}
      >
        <a href="#home" className="flex items-center gap-3 group" aria-label="ZenovaX home">
          <img
            src={getOptimizedImageUrl(logo)}
            width={120}
            height={24}
            fetchpriority="high"
            alt="ZenovaX"
            className="h-6 object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </a>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="relative px-3 py-1.5 text-sm text-text-muted hover:text-text font-medium transition-colors rounded-lg group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {link.name}
              <span className="pointer-events-none absolute left-3 right-3 -bottom-0.5 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {!isLoggedIn ? (
            <>
              <button
                onClick={() => navigate('/auth?mode=login')}
                className="px-5 py-2 rounded-full text-sm text-text font-medium border border-border-strong hover:border-accent hover:bg-accent-tint transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Log in
              </button>
              <button
                onClick={() => navigate('/auth?mode=signup')}
                className="group inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-text-on-accent bg-gradient-accent shadow-[var(--shadow-accent)] hover:brightness-105 hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Get started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </button>
            </>
          ) : (
            <button
              onClick={handlePrimaryCTA}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-text-on-accent bg-gradient-accent shadow-[var(--shadow-accent)] hover:brightness-105 hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Dashboard
            </button>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="md:hidden p-2 rounded-lg text-text hover:bg-accent-tint transition focus-visible:outline-2 focus-visible:outline-accent"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
        </button>
      </motion.div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="md:hidden w-[94%] mx-auto mt-3 bg-surface backdrop-blur-2xl rounded-2xl border border-border py-6 px-6 space-y-5 flex flex-col items-center text-center shadow-[var(--shadow-lg)]"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-text font-medium text-lg hover:text-accent transition"
              >
                {link.name}
              </a>
            ))}

            <div className="w-full pt-4 border-t border-border space-y-3">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      navigate('/auth?mode=login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-6 py-3 rounded-full border border-border-strong text-text font-medium transition"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => {
                      navigate('/auth?mode=signup');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full px-6 py-3 rounded-full bg-gradient-accent text-text-on-accent font-semibold transition"
                  >
                    Get started
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handlePrimaryCTA();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-6 py-3 rounded-full bg-gradient-accent text-text-on-accent font-semibold transition"
                >
                  Dashboard
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
