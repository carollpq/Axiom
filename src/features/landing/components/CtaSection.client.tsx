'use client';

import { useEffect, useRef } from 'react';
import { LandingButton } from './LandingButton';

const HEADING_STYLE = {
  fontFamily: "'Times New Roman', Times, serif",
  color: 'rgba(242, 242, 242, 0.9)',
  textShadow: '6px 6px 14px rgba(0, 0, 0, 0.25)',
} as const;

const BODY_STYLE = {
  fontFamily: "var(--font-tinos), 'Times New Roman', serif",
  color: 'rgba(242, 242, 242, 0.7)',
} as const;

export function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="cta"
      className="relative flex min-h-[70vh] flex-col items-center justify-center px-5 sm:px-8"
    >
      <div
        ref={ref}
        className="reveal flex max-w-2xl flex-col items-center gap-6 text-center sm:gap-8"
      >
        <h2
          className="text-3xl leading-tight font-normal italic sm:text-4xl md:text-5xl lg:text-[3.5rem]"
          style={HEADING_STYLE}
        >
          Ready to Restore Research Integrity?
        </h2>

        <p
          className="max-w-lg text-sm leading-relaxed sm:text-base md:text-lg"
          style={BODY_STYLE}
        >
          Join a peer-review system where every decision is transparent, every
          contribution is recognized, and every record is immutable.
        </p>

        <LandingButton
          href="/login"
          className="min-w-[180px] text-center sm:min-w-[200px]"
        >
          Start Today
        </LandingButton>
      </div>
    </section>
  );
}
