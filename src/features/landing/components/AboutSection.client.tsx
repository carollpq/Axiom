'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const els = section.querySelectorAll<HTMLElement>('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24 md:min-h-screen md:px-10 md:py-32 lg:px-16"
    >
      {/* Content grid — on mobile: text, image, more text. On lg+: side by side */}
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 sm:gap-10 lg:flex-row lg:items-center lg:gap-16">
        {/* Left — text */}
        <div
          className="flex flex-col gap-5 sm:gap-7 lg:max-w-[55%]"
          style={{ textShadow: '6px 6px 14px rgba(0, 0, 0, 0.25)' }}
        >
          <h2
            className="reveal text-[1.75rem] leading-tight font-normal italic sm:text-4xl md:text-5xl lg:text-[3.5rem]"
            style={{
              fontFamily: "'Times New Roman', Times, serif",
              color: 'rgba(242, 242, 242, 0.9)',
            }}
          >
            Why We Built Axiom
          </h2>

          <p
            className="reveal text-sm leading-relaxed sm:text-base md:text-lg"
            style={{
              fontFamily: "var(--font-tinos), 'Times New Roman', serif",
              color: 'rgba(242, 242, 242, 0.85)',
              transitionDelay: '0.15s',
            }}
          >
            The ancient Greeks understood something fundamental: truth, once
            established, should endure. They carved their laws into stone steles
            and displayed them in public squares—not as decoration, but as
            covenant. Any citizen could verify what was written. No authority
            could quietly revise the record.
          </p>

          {/* Tablet image — shown between intro and body on mobile, hidden on lg+ */}
          <div
            className="reveal flex items-center justify-center py-2 lg:hidden"
            style={{ transitionDelay: '0.2s' }}
          >
            <div className="relative w-[220px] sm:w-[300px] md:w-[360px]">
              <Image
                src="/landing/tablet-stone.png"
                alt="Ancient stone stele with carved inscriptions"
                width={460}
                height={620}
                className="h-auto w-full object-contain"
                priority={false}
              />
            </div>
          </div>

          <h3
            className="reveal text-lg font-semibold sm:text-2xl md:text-3xl"
            style={{
              fontFamily: "var(--font-tinos), 'Times New Roman', serif",
              color: 'rgba(242, 242, 242, 0.95)',
              transitionDelay: '0.3s',
            }}
          >
            Axiom returns to this principle.
          </h3>

          <p
            className="reveal text-sm leading-relaxed sm:text-base md:text-lg"
            style={{
              fontFamily: "var(--font-tinos), 'Times New Roman', serif",
              color: 'rgba(242, 242, 242, 0.85)',
              transitionDelay: '0.45s',
            }}
          >
            We believe research integrity shouldn&apos;t depend on institutional
            goodwill or publisher policy. It should be architectural—built into
            the very foundation of how scholarship is recorded, reviewed, and
            attributed.
          </p>

          <p
            className="reveal text-sm leading-relaxed sm:text-base md:text-lg"
            style={{
              fontFamily: "var(--font-tinos), 'Times New Roman', serif",
              color: 'rgba(242, 242, 242, 0.85)',
              transitionDelay: '0.6s',
            }}
          >
            Every review criterion is published immutably before evaluation
            begins—like laws inscribed for all to see. Reviewers earn soulbound
            reputation for every contribution. Authors can challenge unjust
            decisions. And every deadline is enforced on-chain—no paper lost to
            bureaucratic silence.
          </p>

          <p
            className="reveal text-sm leading-relaxed sm:text-base md:text-lg italic"
            style={{
              fontFamily: "var(--font-tinos), 'Times New Roman', serif",
              color: 'rgba(242, 242, 242, 0.7)',
              transitionDelay: '0.75s',
            }}
          >
            We don&apos;t ask journals to change their business. We ask them to
            prove their process.
          </p>
        </div>

        {/* Right — stone tablet image, desktop only (mobile version is inline above) */}
        <div
          className="reveal hidden flex-1 items-center justify-center lg:flex lg:justify-end"
          style={{ transitionDelay: '0.25s' }}
        >
          <div className="relative w-[460px]">
            <Image
              src="/landing/tablet-stone.png"
              alt="Ancient stone stele with carved inscriptions"
              width={460}
              height={620}
              className="h-auto w-full object-contain"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
