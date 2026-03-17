import { LandingButton } from './LandingButton';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: "Who's it for", href: '#who' },
  { label: 'How it works', href: '#how' },
] as const;

export function LandingNav() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-10 py-6">
      {/* Logo */}
      <span
        className="text-lg tracking-wide"
        style={{
          fontFamily: 'var(--font-tinos), Times New Roman, serif',
          color: '#ffffff',
          opacity: 0.8,
        }}
      >
        Logo
      </span>

      {/* Center links */}
      <ul className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10">
        {NAV_LINKS.map((link, i) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="relative pb-1 text-xl tracking-wide transition-opacity hover:opacity-100"
              style={{
                fontFamily: 'var(--font-tinos), Times New Roman, serif',
                color: '#ffffff',
                opacity: i === 0 ? 1 : 0.6,
              }}
            >
              {link.label}
              {i === 0 && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-px"
                  style={{ backgroundColor: '#ffffff' }}
                />
              )}
            </a>
          </li>
        ))}
      </ul>

      {/* Log In button */}
      <LandingButton href="/login" className="py-2.5" variant="nav">
        Log In
      </LandingButton>
    </nav>
  );
}
