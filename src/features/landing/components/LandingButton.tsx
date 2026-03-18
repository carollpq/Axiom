'use client';

import Link from 'next/link';
import { scrollToHash } from '@/src/features/landing/lib/scroll';

interface LandingButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  bgOpacity?: number;
  variant?: 'default' | 'outlined' | 'nav';
}

const VARIANT_STYLES: Record<string, React.CSSProperties> = {
  default: {},
  outlined: { border: '3px solid rgba(242, 242, 242, 0.8)' },
  nav: {
    border: '1px solid #F2F2F2',
    boxShadow: '10px 10px 50px 0px rgba(255, 255, 255, 0.25)',
  },
};

export function LandingButton({
  href,
  children,
  className = '',
  bgOpacity = 0.6,
  variant = 'default',
}: LandingButtonProps) {
  const isHash = href.startsWith('#');

  const handleClick = isHash
    ? (e: React.MouseEvent) => {
        e.preventDefault();
        scrollToHash(href);
      }
    : undefined;

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`relative overflow-hidden px-6 py-3 text-base tracking-wide transition-all hover:brightness-110 sm:px-8 sm:py-4 sm:text-lg ${className}`}
      style={{
        fontFamily: 'var(--font-tinos), Times New Roman, serif',
        background: '#000000',
        color: '#ffffff',
        boxShadow: 'var(--landing-btn-shadow)',
        ...VARIANT_STYLES[variant],
      }}
    >
      <span
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/landing/button-bg.jpg')",
          opacity: bgOpacity,
        }}
      />
      <span className="relative">{children}</span>
    </Link>
  );
}
