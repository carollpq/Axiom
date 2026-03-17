import { LandingNav } from './LandingNav.client';
import { HeroSection } from './HeroSection';

export function LandingPage() {
  return (
    <main className="relative" style={{ background: '#6b6560' }}>
      {/* Fixed background texture — stays static across all sections as user scrolls */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/landing/hero-bg.jpg')" }}
      />

      {/* Dark gradient overlay — matches Figma: linear 55% opacity, #191919 at 13% → #828282 at 100% */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background: 'linear-gradient(to bottom, #191919 13%, #828282 100%)',
          opacity: 0.7,
        }}
      />

      {/* Page content — stacks above the fixed background */}
      <div className="relative z-10">
        <LandingNav />
        <HeroSection />
      </div>
    </main>
  );
}
