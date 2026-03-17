import { LandingNav } from './LandingNav.client';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection.client';
import { SpotlightOverlay } from './SpotlightOverlay.client';
import { SmoothScroll } from './SmoothScroll.client';
import { OrbitalBackground } from './OrbitalBackground';

export function LandingPage() {
  return (
    <main className="relative" style={{ background: '#6b6560' }}>
      <SmoothScroll />

      {/* Fixed background texture — stays static across all sections as user scrolls */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/landing/hero-bg.jpg')" }}
      />

      {/* Animated gradient overlay — interpolates between section spotlight states */}
      <SpotlightOverlay />

      {/* Fixed decorative lines, triangles, and orbital ring */}
      <div className="pointer-events-none fixed inset-0 z-[2]">
        <OrbitalBackground />
      </div>

      {/* Page content — stacks above the fixed background */}
      <div className="relative z-10">
        <LandingNav />
        <HeroSection />
        <AboutSection />
      </div>
    </main>
  );
}
