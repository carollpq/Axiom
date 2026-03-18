'use client';

import { useEffect, useState } from 'react';

export function ScrollIndicator() {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      // Fade out over the first 200px of scroll
      setOpacity(Math.max(0, 1 - window.scrollY / 200));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (opacity === 0) return null;

  return (
    <div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      style={{
        opacity,
        animation: 'hero-fade-up 0.6s var(--landing-ease) 3s both',
        transition: 'opacity 0.15s ease-out',
      }}
    >
      <span
        className="text-xs tracking-[0.2em] uppercase"
        style={{
          fontFamily: 'var(--font-tinos), Times New Roman, serif',
          color: 'rgba(212, 204, 192, 0.9)',
        }}
      >
        Scroll
      </span>
      <svg
        width="16"
        height="24"
        viewBox="0 0 16 24"
        fill="none"
        className="animate-[hero-scroll-bounce_2s_ease-in-out_infinite]"
      >
        <path
          d="M8 0 L8 20 M2 14 L8 20 L14 14"
          stroke="rgba(212, 204, 192, 0.8)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
