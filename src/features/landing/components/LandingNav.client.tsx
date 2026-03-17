'use client';

import { useState } from 'react';
import { LandingButton } from './LandingButton';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: "Who's it for", href: '#who' },
  { label: 'How it works', href: '#how' },
] as const;

export function LandingNav() {
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-6 pb-4 sm:px-8 md:px-10 md:pt-10 md:pb-6">
      {/* Logo */}
      <span
        className="text-base tracking-wide sm:text-lg"
        style={{
          fontFamily: 'var(--font-tinos), Times New Roman, serif',
          color: '#ffffff',
          opacity: 0.8,
          animation: 'hero-fade-up 0.6s var(--landing-ease) 0.3s both',
        }}
      >
        Logo
      </span>

      {/* Center links — hidden on mobile */}
      <ul className="absolute left-1/2 -translate-x-1/2 hidden items-center gap-10 md:flex">
        {NAV_LINKS.map((link, i) => (
          <li
            key={link.label}
            style={{
              animation: `hero-fade-up 0.5s var(--landing-ease) ${0.4 + i * 0.08}s both`,
            }}
          >
            <a
              href={link.href}
              onClick={() => setActive(i)}
              className={`group relative pb-3 text-lg tracking-wide transition-opacity duration-300 lg:text-xl ${active === i ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
              style={{
                fontFamily: 'var(--font-tinos), Times New Roman, serif',
                color: '#ffffff',
              }}
            >
              {link.label}
              <span
                className="absolute bottom-0 left-1/2 h-px -translate-x-1/2 transition-all duration-300 ease-out group-hover:w-[120%]"
                style={{
                  backgroundColor: '#ffffff',
                  width: active === i ? '120%' : '0%',
                }}
              />
            </a>
          </li>
        ))}
      </ul>

      {/* Right side: Log In + hamburger */}
      <div className="flex items-center gap-4">
        <div
          style={{
            animation: 'hero-fade-up 0.5s var(--landing-ease) 0.8s both',
          }}
        >
          <LandingButton
            href="/login"
            className="py-2 text-sm sm:py-2.5 sm:text-base"
            variant="nav"
          >
            Log In
          </LandingButton>
        </div>

        {/* Hamburger — visible on mobile only */}
        <button
          className="flex flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          style={{
            animation: 'hero-fade-up 0.5s var(--landing-ease) 0.5s both',
          }}
        >
          <span
            className="block h-px w-5 transition-all duration-300"
            style={{
              background: '#ffffff',
              transform: menuOpen ? 'rotate(45deg) translateY(3.5px)' : 'none',
            }}
          />
          <span
            className="block h-px w-5 transition-all duration-300"
            style={{
              background: '#ffffff',
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            className="block h-px w-5 transition-all duration-300"
            style={{
              background: '#ffffff',
              transform: menuOpen
                ? 'rotate(-45deg) translateY(-3.5px)'
                : 'none',
            }}
          />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <ul
          className="absolute top-full left-0 right-0 flex flex-col items-center gap-6 py-8 md:hidden"
          style={{
            background: 'rgba(25, 25, 25, 0.95)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {NAV_LINKS.map((link, i) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={() => {
                  setActive(i);
                  setMenuOpen(false);
                }}
                className={`text-lg tracking-wide transition-opacity ${active === i ? 'opacity-100' : 'opacity-60'}`}
                style={{
                  fontFamily: 'var(--font-tinos), Times New Roman, serif',
                  color: '#ffffff',
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
