import { LandingButton } from './LandingButton';
import { ScrollIndicator } from './ScrollIndicator.client';

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 sm:px-8"
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-3 sm:gap-5">
        {/* Axiom title — clip-path reveal left-to-right */}
        <h1
          className="relative mb-1 text-[3.5rem] leading-none font-normal italic sm:mb-2 sm:text-[5rem] md:text-[7rem]"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            opacity: 0.8,
            animation: 'hero-clip-reveal 1s var(--landing-ease) 1.5s both',
          }}
        >
          {/* Base gradient text */}
          <span
            style={{
              background: 'linear-gradient(151deg, #2e2e2e 56%, #0f0f0f 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Axiom
          </span>
          {/* Inner shadow layer */}
          <span
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              background: 'linear-gradient(151deg, #2e2e2e 56%, #0f0f0f 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(4px 4px 5.2px rgba(0, 0, 0, 0.25))',
            }}
          >
            Axiom
          </span>
        </h1>

        {/* Tagline — fade up, "Restored" delayed for emphasis */}
        <h2
          className="mb-3 text-xl leading-tight font-normal sm:mb-6 sm:text-3xl md:text-[2.5rem]"
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            color: '#f2f2f2',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              opacity: 0.7,
              animation: 'hero-word-reveal 0.7s var(--landing-ease) 1.9s both',
            }}
          >
            Research Integrity,
          </span>{' '}
          <em
            className="italic font-normal"
            style={{
              display: 'inline-block',
              opacity: 0.7,
              animation: 'hero-word-reveal 0.7s var(--landing-ease) 2.15s both',
            }}
          >
            Restored
          </em>
        </h2>

        {/* Subtitle paragraph — gentle fade up */}
        <p
          className="mb-8 max-w-xs text-sm leading-relaxed sm:mb-12 sm:max-w-lg sm:text-lg"
          style={{
            fontFamily: 'var(--font-tinos), Times New Roman, serif',
            color: 'rgba(255, 255, 255)',
            animation: 'hero-fade-up 0.8s var(--landing-ease) 2.3s both',
          }}
        >
          A blockchain-backed journal submission and peer-review platform built
          on Hedera to enforce authorship contracts, transparent peer review,
          reviewer reputation, journal accountability, and funding-linked
          guarantees.
        </p>

        {/* CTA buttons — staggered spring entrance, stack on mobile */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <div
            style={{
              animation:
                'hero-fade-up-spring 0.6s var(--landing-ease-spring) 2.6s both',
            }}
          >
            <LandingButton
              href="/login"
              className="min-w-[180px] text-center sm:min-w-[200px]"
            >
              Register Your Research
            </LandingButton>
          </div>
          <div
            style={{
              animation:
                'hero-fade-up-spring 0.6s var(--landing-ease-spring) 2.75s both',
            }}
          >
            <LandingButton
              href="#how"
              className="min-w-[180px] text-center sm:min-w-[200px]"
              bgOpacity={0.8}
              variant="outlined"
            >
              Learn More
            </LandingButton>
          </div>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
