'use client';

import { useEffect, useRef } from 'react';

const SECTIONS = [
  {
    id: 'home',
    angle: 180,
    c1: [25, 25, 25],
    s1: 13,
    c2: [130, 130, 130],
    s2: 100,
  },
  { id: 'about', angle: 63, c1: [8, 8, 8], s1: 0, c2: [130, 130, 130], s2: 87 },
] as const;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getGradient(progress: number) {
  const idx = Math.min(Math.max(progress, 0), SECTIONS.length - 1);
  const from = Math.floor(idx);
  const to = Math.min(from + 1, SECTIONS.length - 1);
  const t = idx - from;

  const a = SECTIONS[from];
  const b = SECTIONS[to];

  const angle = lerp(a.angle, b.angle, t);
  const r1 = lerp(a.c1[0], b.c1[0], t);
  const g1 = lerp(a.c1[1], b.c1[1], t);
  const b1 = lerp(a.c1[2], b.c1[2], t);
  const s1 = lerp(a.s1, b.s1, t);
  const r2 = lerp(a.c2[0], b.c2[0], t);
  const g2 = lerp(a.c2[1], b.c2[1], t);
  const b2 = lerp(a.c2[2], b.c2[2], t);
  const s2 = lerp(a.s2, b.s2, t);

  return `linear-gradient(${angle.toFixed(1)}deg, rgb(${r1.toFixed(0)},${g1.toFixed(0)},${b1.toFixed(0)}) ${s1.toFixed(1)}%, rgb(${r2.toFixed(0)},${g2.toFixed(0)},${b2.toFixed(0)}) ${s2.toFixed(1)}%)`;
}

export function SpotlightOverlay() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const vh = window.innerHeight;
        const progress = Math.min(window.scrollY / vh, SECTIONS.length - 1);
        if (ref.current) ref.current.style.background = getGradient(progress);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{ background: getGradient(0), opacity: 0.7 }}
    />
  );
}
