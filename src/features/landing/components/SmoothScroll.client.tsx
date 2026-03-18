'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import '@/src/features/landing/lib/scroll'; // Window.__lenis type augmentation

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 2.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    // Expose for nav scroll-to usage
    window.__lenis = lenis;

    let frameId: number;
    function raf(time: number) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
      delete window.__lenis;
    };
  }, []);

  return null;
}
