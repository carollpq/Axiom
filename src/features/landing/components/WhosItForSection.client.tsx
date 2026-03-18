'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { CHARACTERS } from '@/src/features/landing/characters';

/* ── Slot positions for carousel: 0=left, 1=center, 2=right ── */
function getSlot(charIndex: number, selected: number): number {
  return (charIndex - selected + 3) % 3;
}

const SLOT_TRANSFORMS = [
  'translateX(-50%) scale(var(--carousel-scale-center))',
  'translateX(-50%) translateX(var(--carousel-offset)) scale(var(--carousel-scale-side))',
  'translateX(-50%) translateX(calc(-1 * var(--carousel-offset))) scale(var(--carousel-scale-side))',
];

const SLOT_Z = [3, 1, 1];
const SLOT_BRIGHTNESS = ['brightness(1)', 'brightness(0.6)', 'brightness(0.6)'];
const SLOT_OPACITY = [1, 0.6, 0.6];

const HEADING_SHADOW = '10px 10px 20px rgba(0, 0, 0, 0.25)';
const TEXT_SHADOW = '4px 4px 20px rgba(0, 0, 0, 0.25)';

const CROSSFADE_VISIBLE: React.CSSProperties = {
  opacity: 1,
  transform: 'translateY(0)',
  transition:
    'opacity 0.5s var(--landing-ease), transform 0.5s var(--landing-ease)',
  pointerEvents: 'auto',
};
const CROSSFADE_HIDDEN: React.CSSProperties = {
  opacity: 0,
  transform: 'translateY(12px)',
  transition:
    'opacity 0.5s var(--landing-ease), transform 0.5s var(--landing-ease)',
  pointerEvents: 'none',
};

function CharacterLabel({
  title,
  role,
  className,
  style,
}: {
  title: string;
  role: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`absolute left-1/2 -translate-x-1/2 overflow-hidden whitespace-nowrap text-center tracking-wide ${className ?? ''}`}
      style={{
        fontFamily: 'var(--font-tinos), Times New Roman, serif',
        color: '#ffffff',
        background: '#000000',
        border: '1px solid #F2F2F2',
        boxShadow: 'var(--landing-btn-shadow)',
        ...style,
      }}
    >
      <span
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/landing/button-bg.jpg')",
          opacity: 0.3,
        }}
      />
      <span className="relative">
        {title} - {role}
      </span>
    </span>
  );
}

export function WhosItForSection() {
  const [selected, setSelected] = useState(0); // start with first, scroll drives selection
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const hasRevealed = useRef(false);

  /* Scroll-driven character selection */
  const handleScroll = useCallback(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const rect = outer.getBoundingClientRect();
    const scrolled = -rect.top;
    const sectionHeight = outer.offsetHeight - window.innerHeight;

    if (sectionHeight <= 0) return;

    const progress = Math.max(0, Math.min(1, scrolled / sectionHeight));
    const idx = Math.min(
      CHARACTERS.length - 1,
      Math.floor(progress * CHARACTERS.length),
    );
    setSelected((prev) => (prev === idx ? prev : idx));
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /* Scroll-triggered reveal */
  useEffect(() => {
    const sticky = stickyRef.current;
    if (!sticky) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasRevealed.current) {
            hasRevealed.current = true;
            const els = sticky.querySelectorAll<HTMLElement>('.reveal');
            els.forEach((el) => el.classList.add('visible'));
          }
        });
      },
      { threshold: 0.3 },
    );
    observer.observe(sticky);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      id="who"
      style={{ height: `${CHARACTERS.length * 100}vh` }}
    >
      <div ref={stickyRef} className="sticky top-0 h-screen overflow-hidden">
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-5 pt-20 sm:px-8 sm:pt-24 md:px-10 md:pt-28 lg:px-16">
          {/* ── Heading ── */}
          <h2
            className="reveal text-center text-[1.75rem] italic tracking-wide sm:text-3xl md:text-4xl"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              color: 'rgba(242, 242, 242, 0.9)',
              textShadow: HEADING_SHADOW,
            }}
          >
            Who is Axiom for
          </h2>

          {/* ── Text columns (desktop) ── */}
          <div className="mt-6 hidden w-full md:grid md:grid-cols-2 md:gap-12 lg:gap-20">
            {/* Left column — pain point + quote (offset up) */}
            <div className="relative min-h-[180px] lg:min-h-[200px]">
              {CHARACTERS.map((char, i) => (
                <div
                  key={char.name + '-left'}
                  className="absolute inset-0 flex flex-col justify-start"
                  style={i === selected ? CROSSFADE_VISIBLE : CROSSFADE_HIDDEN}
                >
                  <p
                    className="reveal text-sm leading-relaxed sm:text-base lg:text-lg"
                    style={{
                      fontFamily: 'var(--font-tinos), Times New Roman, serif',
                      color: 'rgba(242, 242, 242, 0.9)',
                      textShadow: TEXT_SHADOW,
                      transitionDelay: '0.15s',
                    }}
                  >
                    {char.leftText}
                  </p>
                  <p
                    className="reveal mt-4 text-sm italic leading-relaxed lg:text-base"
                    style={{
                      fontFamily: "'Times New Roman', Times, serif",
                      color: 'rgba(242, 242, 242, 0.9)',
                      textShadow: TEXT_SHADOW,
                      transitionDelay: '0.25s',
                    }}
                  >
                    {char.quote}
                  </p>
                </div>
              ))}
            </div>

            {/* Right column — Axiom solution (offset down) */}
            <div className="relative mt-8 min-h-[180px] lg:mt-10 lg:min-h-[200px]">
              {CHARACTERS.map((char, i) => (
                <div
                  key={char.name + '-right'}
                  className="absolute inset-0 flex flex-col justify-start"
                  style={i === selected ? CROSSFADE_VISIBLE : CROSSFADE_HIDDEN}
                >
                  <p
                    className="reveal text-right text-sm leading-relaxed sm:text-base lg:text-lg"
                    style={{
                      fontFamily: 'var(--font-tinos), Times New Roman, serif',
                      color: 'rgba(242, 242, 242, 0.9)',
                      textShadow: TEXT_SHADOW,
                      transitionDelay: '0.2s',
                    }}
                  >
                    {char.rightText}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Text (mobile — stacked) ── */}
          <div className="mt-6 w-full md:hidden">
            <div className="relative min-h-[180px]">
              {CHARACTERS.map((char, i) => (
                <div
                  key={char.name + '-mobile'}
                  className="absolute inset-0 flex flex-col gap-3"
                  style={i === selected ? CROSSFADE_VISIBLE : CROSSFADE_HIDDEN}
                >
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      fontFamily: 'var(--font-tinos), Times New Roman, serif',
                      color: 'rgba(242, 242, 242, 0.9)',
                      textShadow: TEXT_SHADOW,
                    }}
                  >
                    {char.leftText}
                  </p>
                  <p
                    className="text-sm italic leading-relaxed"
                    style={{
                      fontFamily: "'Times New Roman', Times, serif",
                      color: 'rgba(242, 242, 242, 0.9)',
                      textShadow: TEXT_SHADOW,
                    }}
                  >
                    {char.quote}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      fontFamily: 'var(--font-tinos), Times New Roman, serif',
                      color: 'rgba(242, 242, 242, 0.9)',
                      textShadow: TEXT_SHADOW,
                    }}
                  >
                    {char.rightText}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Carousel (desktop/tablet) — fills remaining space, clips at bottom ── */}
          <div
            className="reveal relative hidden flex-1 md:block"
            style={{ transitionDelay: '0.3s' }}
          >
            {CHARACTERS.map((char, i) => {
              const slot = getSlot(i, selected);
              return (
                <button
                  key={char.name}
                  onClick={() => setSelected(i)}
                  className="absolute bottom-0 left-1/2 cursor-pointer"
                  style={{
                    transform: SLOT_TRANSFORMS[slot],
                    zIndex: SLOT_Z[slot],
                    filter: SLOT_BRIGHTNESS[slot],
                    opacity: SLOT_OPACITY[slot],
                    transition: 'all 0.6s var(--landing-ease)',
                    transformOrigin: 'bottom center',
                  }}
                >
                  <div
                    className="relative"
                    style={{
                      transform:
                        char.charScale !== 1
                          ? `scale(${char.charScale})`
                          : undefined,
                      transformOrigin: 'bottom center',
                    }}
                  >
                    <Image
                      src={char.image}
                      alt={char.name}
                      width={char.imgWidth}
                      height={char.imgHeight}
                      className={`object-contain ${char.imgClass}`}
                      priority={i === 0}
                    />
                    <CharacterLabel
                      title={char.title}
                      role={char.role}
                      className="-translate-y-1/2 px-5 py-2.5 text-sm sm:text-base"
                      style={{
                        zIndex: 4,
                        top: char.plateTop,
                        scale:
                          char.charScale !== 1
                            ? `${1 / char.charScale}`
                            : undefined,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Mobile: single character + dots ── */}
          <div className="relative flex-1 md:hidden">
            <div className="absolute inset-0">
              {CHARACTERS.map((char, i) => (
                <div
                  key={char.name + '-mob'}
                  className="absolute inset-0 flex items-end justify-center"
                  style={{
                    opacity: i === selected ? 1 : 0,
                    transform: i === selected ? 'scale(1)' : 'scale(0.9)',
                    transition:
                      'opacity 0.5s var(--landing-ease), transform 0.5s var(--landing-ease)',
                    pointerEvents: i === selected ? 'auto' : 'none',
                  }}
                >
                  <div className="relative">
                    <Image
                      src={char.image}
                      alt={char.name}
                      width={char.imgWidth}
                      height={char.imgHeight}
                      className="h-auto w-[220px] object-contain"
                      priority={i === 0}
                    />
                    <CharacterLabel
                      title={char.title}
                      role={char.role}
                      className="top-1/2 -translate-y-1/2 px-4 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
              {CHARACTERS.map((char, i) => (
                <button
                  key={char.name + '-dot'}
                  onClick={() => setSelected(i)}
                  aria-label={`Select ${char.name}`}
                  className="h-2.5 w-2.5 rounded-full transition-all duration-300"
                  style={{
                    background:
                      i === selected
                        ? 'rgba(242, 242, 242, 0.8)'
                        : 'rgba(242, 242, 242, 0.25)',
                    transform: i === selected ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
