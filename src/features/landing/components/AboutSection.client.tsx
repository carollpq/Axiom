'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

/**
 * Total scroll height for the About section.
 * The sticky viewport locks in place while the user scrolls through this
 * height, progressively revealing each text block.
 */
const SCROLL_HEIGHT = '400vh';

/** Hold the final state for this fraction of the scroll before releasing */
const HOLD_TAIL = 0.12;

const BODY_STYLE = {
  fontFamily: "var(--font-tinos), 'Times New Roman', serif",
  color: 'rgba(242, 242, 242, 0.85)',
} as const;

const tabletImage = (
  <Image
    src="/landing/tablet-stone.png"
    alt="Ancient stone stele with carved inscriptions"
    width={460}
    height={620}
    className="h-auto w-full object-contain"
    priority={false}
  />
);

export function AboutSection() {
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    // Collect all .about-reveal elements and group by data-reveal-group.
    // Elements sharing the same group number reveal at the same scroll step.
    const allEls = Array.from(
      outer.querySelectorAll<HTMLElement>('.about-reveal'),
    );
    if (allEls.length === 0) return;

    // Build ordered groups: elements with the same data-reveal-group
    // reveal together; ungrouped elements each get their own step.
    // Reveals are one-way — once visible, they stay visible.
    const groups: HTMLElement[][] = [];
    const groupMap = new Map<string, number>();
    for (const el of allEls) {
      const g = el.dataset.revealGroup;
      if (g != null && groupMap.has(g)) {
        groups[groupMap.get(g)!].push(el);
      } else {
        if (g != null) groupMap.set(g, groups.length);
        groups.push([el]);
      }
    }
    const stepCount = groups.length;
    let revealedCount = 0;

    // Cache scrollable height — only changes on resize
    let cachedScrollable = outer.offsetHeight - window.innerHeight;

    const onResize = () => {
      cachedScrollable = outer.offsetHeight - window.innerHeight;
    };

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (cachedScrollable <= 0) {
          ticking = false;
          return;
        }

        const rect = outer.getBoundingClientRect();

        // 0 → 1 progress through the section
        const raw = Math.max(0, Math.min(1, -rect.top / cachedScrollable));

        // Usable range: [0, 1 - HOLD_TAIL] maps to reveal progress
        const revealProgress = Math.min(1, raw / (1 - HOLD_TAIL));

        // Only loop over groups not yet revealed
        for (let i = revealedCount; i < stepCount; i++) {
          if (revealProgress > i / stepCount) {
            for (const el of groups[i]) {
              el.classList.add('visible');
            }
            revealedCount++;
          } else {
            break; // thresholds are ordered
          }
        }

        // Self-remove when all groups are revealed
        if (revealedCount === stepCount) {
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onResize);
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    onScroll(); // run once on mount in case already scrolled
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div
      ref={outerRef}
      id="about"
      className="relative"
      style={{ height: SCROLL_HEIGHT }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 sm:gap-10 sm:px-8 md:px-10 lg:flex-row lg:items-center lg:gap-16 lg:px-16">
          {/* Left — text */}
          <div
            className="flex flex-col gap-7 sm:gap-9 lg:max-w-[55%]"
            style={{ textShadow: '6px 6px 14px rgba(0, 0, 0, 0.25)' }}
          >
            <h2
              className="about-reveal text-[1.75rem] leading-tight font-normal italic sm:text-4xl md:text-5xl lg:text-[3.5rem]"
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                color: 'rgba(242, 242, 242, 0.9)',
              }}
            >
              Why We Built Axiom
            </h2>

            <p
              data-reveal-group="1"
              className="about-reveal text-sm leading-relaxed sm:text-base md:text-lg"
              style={BODY_STYLE}
            >
              The ancient Greeks understood something fundamental: truth, once
              established, should endure. They carved their laws into stone
              steles and displayed them in public squares—not as decoration, but
              as covenant. Any citizen could verify what was written. No
              authority could quietly revise the record.
            </p>

            {/* Tablet image — shown between intro and body on mobile, hidden on lg+ */}
            <div
              data-reveal-group="1"
              className="about-reveal flex items-center justify-center py-2 lg:hidden"
            >
              <div className="relative w-[220px] sm:w-[300px] md:w-[360px]">
                {tabletImage}
              </div>
            </div>

            <h3
              className="about-reveal text-lg font-semibold sm:text-2xl md:text-3xl"
              style={{
                fontFamily: "var(--font-tinos), 'Times New Roman', serif",
                color: 'rgba(242, 242, 242, 0.95)',
              }}
            >
              Axiom returns to this principle.
            </h3>

            <p
              className="about-reveal text-sm leading-relaxed sm:text-base md:text-lg"
              style={BODY_STYLE}
            >
              We believe research integrity shouldn&apos;t depend on
              institutional goodwill or publisher policy. It should be
              architectural—built into the very foundation of how scholarship is
              recorded, reviewed, and attributed.
            </p>

            <p
              className="about-reveal text-sm leading-relaxed sm:text-base md:text-lg"
              style={BODY_STYLE}
            >
              Every review criterion is published immutably before evaluation
              begins—like laws inscribed for all to see. Reviewers earn
              soulbound reputation for every contribution. Authors can challenge
              unjust decisions. And every deadline is enforced on-chain—no paper
              lost to bureaucratic silence.
            </p>

            <p
              className="about-reveal text-sm leading-relaxed sm:text-base md:text-lg italic"
              style={{
                fontFamily: "var(--font-tinos), 'Times New Roman', serif",
                color: 'rgba(242, 242, 242, 0.7)',
              }}
            >
              We don&apos;t ask journals to change their business. We ask them
              to prove their process.
            </p>
          </div>

          {/* Right — stone tablet image, desktop only (mobile version is inline above) */}
          <div
            data-reveal-group="1"
            className="about-reveal hidden flex-1 items-center justify-center lg:flex lg:justify-end"
          >
            <div className="relative w-[460px]">{tabletImage}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
