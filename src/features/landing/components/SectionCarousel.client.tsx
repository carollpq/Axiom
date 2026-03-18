'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { CHARACTERS } from '@/src/features/landing/characters';

/* ════════════════════════════════════════════════════════════
   Shared constants
   ════════════════════════════════════════════════════════════ */

const DROP_SHADOW = '10px 10px 20px rgba(0, 0, 0, 0.25)';
const FONT_SERIF = 'var(--font-tinos), Times New Roman, serif';
const FONT_SERIF_ALT = "'Times New Roman', Times, serif";
const TEXT_PRIMARY = 'rgba(242, 242, 242, 0.9)';
const TEXT_SECONDARY = 'rgba(242, 242, 242, 0.85)';
const TEXT_DIM = 'rgba(242, 242, 242, 0.5)';

/* ════════════════════════════════════════════════════════════
   Who's It For — constants & helpers
   ════════════════════════════════════════════════════════════ */

const NUM_CHARACTERS = CHARACTERS.length;

function getSlot(charIndex: number, selected: number): number {
  return (charIndex - selected + NUM_CHARACTERS) % NUM_CHARACTERS;
}

const SLOT_TRANSFORMS = [
  'translateX(-50%) scale(var(--carousel-scale-center))',
  'translateX(-50%) translateX(var(--carousel-offset)) scale(var(--carousel-scale-side))',
  'translateX(-50%) translateX(calc(-1 * var(--carousel-offset))) scale(var(--carousel-scale-side))',
];
const SLOT_Z = [3, 1, 1];
const SLOT_BRIGHTNESS = ['brightness(1)', 'brightness(0.6)', 'brightness(0.6)'];
const SLOT_OPACITY = [1, 0.6, 0.6];

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
        fontFamily: FONT_SERIF,
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

/* ════════════════════════════════════════════════════════════
   How It Works — constants
   ════════════════════════════════════════════════════════════ */

const STEPS = [
  {
    label: 'Register',
    description:
      'Researchers, reviewers, and editors connect their wallets and create profiles. Every participant gets a verifiable on-chain identity from day one.',
  },
  {
    label: 'Collaborate',
    description:
      'Researchers build authorship contracts specifying each contributor\u2019s role and percentage. Every co-author cryptographically signs before the paper can be submitted \u2014 no disputed credit, no ambiguity.',
  },
  {
    label: 'Submit',
    description:
      'The paper is hashed on Hedera, uploaded to IPFS, and submitted to a journal. The editor receives it and either desk-rejects or assigns at least two peer reviewers with enforced deadlines.',
  },
  {
    label: 'Review',
    description:
      'Reviewers evaluate against pre-registered criteria \u2014 structured, per-criterion feedback with no vague rejections. Researchers receive real-time status updates and can invoke a rebuttal phase if reviews are unfair or lack depth.',
  },
  {
    label: 'Publish',
    description:
      'The editor releases a final decision backed by a transparent, auditable trail. Reviewers earn soulbound reputation tokens. Researchers rate their reviewers. The entire process is on the record.',
  },
] as const;

/* ════════════════════════════════════════════════════════════
   Scroll phases
   ─────────────────────────────────────────────────────────
   Outer height = 1400vh → scrollable = 1300vh
   Phase 1  (0 – 0.45): Character cycling  (~585vh, ~195vh per character)
   Phase 2  (0.45 – 0.58): Horizontal slide who→how (~169vh)
   Phase 3  (0.58 – 1.00): Step cycling     (~546vh, ~109vh per step)
   ════════════════════════════════════════════════════════════ */

const PHASE1_END = 0.45;
const PHASE2_END = 0.58;
const NUM_STEPS = 5;

export function SectionCarousel() {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const whoContentRef = useRef<HTMLDivElement>(null);
  const hasRevealed = useRef(false);
  const lastSelected = useRef(0);
  const lastStep = useRef(0);
  const lastPhase = useRef(-1);

  const [selected, setSelected] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  /* ── Main scroll handler ── */
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const outer = outerRef.current;
        const track = trackRef.current;
        if (!outer || !track) {
          ticking = false;
          return;
        }

        const rect = outer.getBoundingClientRect();
        const scrollable = outer.offsetHeight - window.innerHeight;
        if (scrollable <= 0) {
          ticking = false;
          return;
        }

        const scrolled = -rect.top;
        const progress = Math.max(0, Math.min(1, scrolled / scrollable));

        /* Phase 1: Character cycling */
        if (progress <= PHASE1_END) {
          const charProgress = progress / PHASE1_END; // 0→1
          const idx = Math.min(
            NUM_CHARACTERS - 1,
            Math.floor(charProgress * NUM_CHARACTERS),
          );
          if (idx !== lastSelected.current) {
            lastSelected.current = idx;
            setSelected(idx);
          }
          if (lastPhase.current !== 1) {
            track.style.transform = 'translateX(0)';
            lastPhase.current = 1;
          }
        } else if (progress <= PHASE2_END) {
        /* Phase 2: Horizontal slide */
          lastPhase.current = 2;
          const slideT = (progress - PHASE1_END) / (PHASE2_END - PHASE1_END); // 0→1
          const eased = 1 - Math.pow(1 - slideT, 3); // ease-out cubic
          track.style.transform = `translateX(${(-eased * 100).toFixed(2)}vw)`;
        } else {
        /* Phase 3: Step cycling in How It Works */
          if (lastPhase.current !== 3) {
            track.style.transform = 'translateX(-100vw)';
            lastPhase.current = 3;
          }
          const stepProgress = (progress - PHASE2_END) / (1 - PHASE2_END); // 0→1
          const stepIdx = Math.min(
            NUM_STEPS - 1,
            Math.floor(stepProgress * NUM_STEPS),
          );
          if (stepIdx !== lastStep.current) {
            lastStep.current = stepIdx;
            setActiveStep(stepIdx);
          }
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Who's It For reveal observer ── */
  useEffect(() => {
    const el = whoContentRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasRevealed.current) {
            hasRevealed.current = true;
            const els = el.querySelectorAll<HTMLElement>('.reveal');
            els.forEach((node) => node.classList.add('visible'));
          }
        });
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleStepClick = (i: number) => setActiveStep(i);

  return (
    <div ref={outerRef} className="relative" style={{ height: '1400vh' }}>
      {/* Nav anchor markers — positioned within the scroll so IntersectionObserver picks them up */}
      <div
        id="who"
        className="pointer-events-none absolute top-0 left-0 w-px"
        style={{ height: '50%' }}
      />
      <div
        id="how"
        className="pointer-events-none absolute left-0 w-px"
        style={{ top: '45%', height: '55%' }}
      />

      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Horizontal track — two panels side-by-side */}
        <div
          ref={trackRef}
          className="flex h-full"
          style={{ width: '200vw', willChange: 'transform' }}
        >
          {/* ════════════════════════════════════════════════
              Panel 1 — Who's It For
              ════════════════════════════════════════════════ */}
          <div className="h-full w-screen flex-shrink-0">
            <div
              ref={whoContentRef}
              className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-5 pt-20 sm:px-8 sm:pt-24 md:px-10 md:pt-28 lg:px-16"
            >
              {/* Heading */}
              <h2
                className="reveal text-center text-[1.75rem] italic tracking-wide sm:text-3xl md:text-4xl"
                style={{
                  fontFamily: FONT_SERIF_ALT,
                  color: TEXT_PRIMARY,
                  textShadow: DROP_SHADOW,
                }}
              >
                Who is Axiom for
              </h2>

              {/* Text columns (desktop) */}
              <div className="mt-6 hidden w-full md:grid md:grid-cols-2 md:gap-12 lg:gap-20">
                {/* Left column — pain point + quote */}
                <div className="relative min-h-[180px] lg:min-h-[200px]">
                  {CHARACTERS.map((char, i) => (
                    <div
                      key={char.name + '-left'}
                      className="absolute inset-0 flex flex-col justify-start"
                      style={
                        i === selected ? CROSSFADE_VISIBLE : CROSSFADE_HIDDEN
                      }
                    >
                      <p
                        className="reveal text-sm leading-relaxed sm:text-base lg:text-lg"
                        style={{
                          fontFamily: FONT_SERIF,
                          color: TEXT_PRIMARY,
                          textShadow: DROP_SHADOW,
                          transitionDelay: '0.15s',
                        }}
                      >
                        {char.leftText}
                      </p>
                      <p
                        className="reveal mt-4 text-sm italic leading-relaxed lg:text-base"
                        style={{
                          fontFamily: FONT_SERIF_ALT,
                          color: TEXT_PRIMARY,
                          textShadow: DROP_SHADOW,
                          transitionDelay: '0.25s',
                        }}
                      >
                        {char.quote}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Right column — Axiom solution */}
                <div className="relative mt-8 min-h-[180px] lg:mt-10 lg:min-h-[200px]">
                  {CHARACTERS.map((char, i) => (
                    <div
                      key={char.name + '-right'}
                      className="absolute inset-0 flex flex-col justify-start"
                      style={
                        i === selected ? CROSSFADE_VISIBLE : CROSSFADE_HIDDEN
                      }
                    >
                      <p
                        className="reveal text-right text-sm leading-relaxed sm:text-base lg:text-lg"
                        style={{
                          fontFamily: FONT_SERIF,
                          color: TEXT_PRIMARY,
                          textShadow: DROP_SHADOW,
                          transitionDelay: '0.2s',
                        }}
                      >
                        {char.rightText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Text (mobile — stacked) */}
              <div className="mt-6 w-full md:hidden">
                <div className="relative min-h-[180px]">
                  {CHARACTERS.map((char, i) => (
                    <div
                      key={char.name + '-mobile'}
                      className="absolute inset-0 flex flex-col gap-3"
                      style={
                        i === selected ? CROSSFADE_VISIBLE : CROSSFADE_HIDDEN
                      }
                    >
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          fontFamily: FONT_SERIF,
                          color: TEXT_PRIMARY,
                          textShadow: DROP_SHADOW,
                        }}
                      >
                        {char.leftText}
                      </p>
                      <p
                        className="text-sm italic leading-relaxed"
                        style={{
                          fontFamily: FONT_SERIF_ALT,
                          color: TEXT_PRIMARY,
                          textShadow: DROP_SHADOW,
                        }}
                      >
                        {char.quote}
                      </p>
                      <p
                        className="text-sm leading-relaxed"
                        style={{
                          fontFamily: FONT_SERIF,
                          color: TEXT_PRIMARY,
                          textShadow: DROP_SHADOW,
                        }}
                      >
                        {char.rightText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel (desktop/tablet) */}
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

              {/* Mobile: single character + dots */}
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

          {/* ════════════════════════════════════════════════
              Panel 2 — How It Works
              ════════════════════════════════════════════════ */}
          <div className="flex h-full w-screen flex-shrink-0 items-center">
            <div className="w-full px-6 sm:px-10 lg:px-16">
              <div className="mx-auto max-w-6xl">
                {/* Heading */}
                <h2
                  className="mb-12 text-4xl tracking-wide sm:text-5xl md:mb-16 md:text-6xl"
                  style={{
                    fontFamily: FONT_SERIF,
                    fontStyle: 'italic',
                    color: '#ffffff',
                    textShadow: DROP_SHADOW,
                  }}
                >
                  How it works
                </h2>

                {/* Columns (desktop) */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-5 gap-6 lg:gap-8">
                    {STEPS.map((step, i) => {
                      const isActive = i === activeStep;
                      return (
                        <button
                          key={step.label}
                          onClick={() => handleStepClick(i)}
                          className="cursor-pointer border-0 bg-transparent p-0 text-left"
                        >
                          <div
                            className="rounded-sm px-4 py-5 transition-all duration-500 lg:px-5 lg:py-6"
                            style={{
                              opacity: isActive ? 1 : 0.35,
                              filter: isActive
                                ? 'brightness(1.1)'
                                : 'brightness(0.6)',
                              transform: isActive ? 'scale(1.03)' : 'scale(1)',
                            }}
                          >
                            <span
                              className="mb-2 block text-xs tracking-widest uppercase"
                              style={{
                                fontFamily: FONT_SERIF,
                                color: TEXT_DIM,
                                textShadow: DROP_SHADOW,
                              }}
                            >
                              Step {i + 1}
                            </span>
                            <h3
                              className="mb-3 text-lg tracking-wide lg:text-xl"
                              style={{
                                fontFamily: FONT_SERIF,
                                fontWeight: 600,
                                color: '#ffffff',
                                textShadow: DROP_SHADOW,
                              }}
                            >
                              {step.label}
                            </h3>
                            <p
                              className="text-sm leading-relaxed lg:text-base"
                              style={{
                                fontFamily: FONT_SERIF,
                                color: TEXT_SECONDARY,
                                textShadow: DROP_SHADOW,
                              }}
                            >
                              {step.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Timeline bar */}
                  <div className="mt-10">
                    <div className="relative h-[3px] w-full">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: 'rgba(255, 255, 255, 0.15)',
                        }}
                      />
                      <div
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(activeStep / (STEPS.length - 1)) * 100}%`,
                          background:
                            'linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.85))',
                        }}
                      />
                      {STEPS.map((step, i) => {
                        const isActive = i === activeStep;
                        const isPast = i < activeStep;
                        return (
                          <button
                            key={step.label}
                            onClick={() => handleStepClick(i)}
                            className="absolute top-1/2 cursor-pointer border-0 bg-transparent p-0"
                            style={{
                              left: `${(i / (STEPS.length - 1)) * 100}%`,
                              transform: 'translateX(-50%) translateY(-50%)',
                            }}
                          >
                            {isActive && (
                              <span
                                className="absolute top-1/2 left-1/2 rounded-full"
                                style={{
                                  width: 28,
                                  height: 28,
                                  transform: 'translate(-50%, -50%)',
                                  background:
                                    'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)',
                                  animation:
                                    'how-pulse 2s ease-in-out infinite',
                                }}
                              />
                            )}
                            <span
                              className="relative block rounded-full transition-all duration-300"
                              style={{
                                width: isActive ? 14 : 10,
                                height: isActive ? 14 : 10,
                                background:
                                  isActive || isPast
                                    ? 'rgba(255, 255, 255, 0.95)'
                                    : 'rgba(255, 255, 255, 0.35)',
                                boxShadow: isActive
                                  ? '0 0 12px rgba(255,255,255,0.5)'
                                  : 'none',
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mobile: stacked cards */}
                <div className="flex flex-col gap-3 md:hidden">
                  {STEPS.map((step, i) => {
                    const isActive = i === activeStep;
                    return (
                      <button
                        key={step.label}
                        onClick={() => handleStepClick(i)}
                        className="cursor-pointer border-0 bg-transparent p-0 text-left"
                      >
                        <div
                          className="rounded-sm px-4 py-4 transition-all duration-500"
                          style={{
                            opacity: isActive ? 1 : 0.35,
                            filter: isActive
                              ? 'brightness(1.1)'
                              : 'brightness(0.6)',
                          }}
                        >
                          <div className="flex items-baseline gap-3">
                            <span
                              className="mt-1 block flex-shrink-0 rounded-full"
                              style={{
                                width: isActive ? 10 : 7,
                                height: isActive ? 10 : 7,
                                background: isActive
                                  ? 'rgba(255, 255, 255, 0.95)'
                                  : 'rgba(255, 255, 255, 0.4)',
                                boxShadow: isActive
                                  ? '0 0 8px rgba(255,255,255,0.4)'
                                  : 'none',
                                transition: 'all 0.3s var(--landing-ease)',
                              }}
                            />
                            <div>
                              <h3
                                className="text-base tracking-wide"
                                style={{
                                  fontFamily: FONT_SERIF,
                                  fontWeight: 600,
                                  color: '#ffffff',
                                  textShadow: DROP_SHADOW,
                                }}
                              >
                                {step.label}
                              </h3>
                              <div
                                className="overflow-hidden transition-all duration-500"
                                style={{
                                  maxHeight: isActive ? 200 : 0,
                                  opacity: isActive ? 1 : 0,
                                }}
                              >
                                <p
                                  className="mt-2 text-sm leading-relaxed"
                                  style={{
                                    fontFamily:
                                      'var(--font-tinos), Times New Roman, serif',
                                    color: TEXT_SECONDARY,
                                    textShadow: DROP_SHADOW,
                                  }}
                                >
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
