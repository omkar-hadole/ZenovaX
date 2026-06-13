import footerLogo from '../../assets/footerlogo.svg';

const columns = [
  {
    heading: 'Platform',
    links: [
      { name: 'Features', href: '#features' },
      { name: 'How it works', href: '#journey' },
      { name: 'FAQ', href: '#faq' },
    ],
  },
  {
    heading: 'Get started',
    links: [
      { name: 'Log in', href: '/auth?mode=login' },
      { name: 'Sign up', href: '/auth?mode=signup' },
    ],
  },
];

export default function Footer() {
  return (
    <footer id="contact" className="relative bg-bg-subtle border-t border-border">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <img
              src={footerLogo}
              alt="ZenovaX"
              width={140}
              height={28}
              className="h-7 object-contain"
            />
            <p className="mt-5 max-w-sm text-text-muted leading-relaxed">
              A peer-to-peer learning platform where students teach students,
              with safe bookings, live practice, and verified mentorship.
            </p>
          </div>

          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="text-sm font-semibold tracking-widest uppercase text-text-subtle">
                {col.heading}
              </h3>
              <ul className="mt-5 space-y-3 list-none">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-text-muted hover:text-accent transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-text-subtle">
            &copy; {new Date().getFullYear()} ZenovaX. All rights reserved.
          </p>
          <p className="text-sm text-text-subtle">
            Peer learning, engineered with care.
          </p>
        </div>
      </div>
    </footer>
  );
}
