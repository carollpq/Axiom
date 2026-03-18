export function OrbitalBackground() {
  return (
    <>
      {/* ─── Orbital ellipse + orbs (center SVG) ─── */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <path
            id="orbit-path"
            d="M -420,0 A 420,200 0 1,0 420,0 A 420,200 0 1,0 -420,0"
          />
          <filter id="orb-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Static tilted ellipse */}
        <ellipse
          cx="720"
          cy="420"
          rx="420"
          ry="200"
          transform="rotate(-12 720 420)"
          stroke="rgba(212, 204, 192, 0.2)"
          strokeWidth="1"
          fill="none"
          opacity="0"
        >
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            begin="1.2s"
            dur="0.8s"
            fill="freeze"
          />
        </ellipse>

        {/* Orb 1 */}
        <g transform="translate(720,420) rotate(-12)" opacity="0">
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            begin="1.3s"
            dur="0.6s"
            fill="freeze"
          />
          <circle r="6" fill="rgba(212, 204, 192, 0.5)" filter="url(#orb-glow)">
            <animateMotion dur="30s" repeatCount="indefinite">
              <mpath href="#orbit-path" />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0.15;0.7;1;0.7;0.15"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="6;8;6"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Orb 2 */}
        <g transform="translate(720,420) rotate(-12)" opacity="0">
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            begin="1.4s"
            dur="0.6s"
            fill="freeze"
          />
          <circle r="5" fill="rgba(212, 204, 192, 0.4)" filter="url(#orb-glow)">
            <animateMotion dur="30s" repeatCount="indefinite" begin="-10s">
              <mpath href="#orbit-path" />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0.1;0.6;0.9;0.6;0.1"
              dur="3s"
              repeatCount="indefinite"
              begin="-1s"
            />
            <animate
              attributeName="r"
              values="5;7;5"
              dur="3s"
              repeatCount="indefinite"
              begin="-1s"
            />
          </circle>
        </g>

        {/* Orb 3 */}
        <g transform="translate(720,420) rotate(-12)" opacity="0">
          <animate
            attributeName="opacity"
            from="0"
            to="1"
            begin="1.5s"
            dur="0.6s"
            fill="freeze"
          />
          <circle
            r="4"
            fill="rgba(212, 204, 192, 0.45)"
            filter="url(#orb-glow)"
          >
            <animateMotion dur="30s" repeatCount="indefinite" begin="-20s">
              <mpath href="#orbit-path" />
            </animateMotion>
            <animate
              attributeName="opacity"
              values="0.12;0.5;0.85;0.5;0.12"
              dur="5s"
              repeatCount="indefinite"
              begin="-2.5s"
            />
            <animate
              attributeName="r"
              values="4;6;4"
              dur="5s"
              repeatCount="indefinite"
              begin="-2.5s"
            />
          </circle>
        </g>
      </svg>

      {/* ═══ LEFT SIDE ═══ */}

      {/* Left vertical — top half (above triangle) */}
      <div
        className="pointer-events-none absolute top-[6%] left-[5%] h-[38%] w-px origin-top"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(212, 204, 192, 0.2) 15%, rgba(212, 204, 192, 0.2) 85%, transparent)',
          animation: 'hero-line-extend-y 0.8s var(--landing-ease) 0.6s both',
        }}
      />
      {/* Left triangle — splits the vertical line */}
      <svg
        className="pointer-events-none absolute top-1/2 left-[5%] -translate-x-1/2 -translate-y-1/2"
        width="28"
        height="24"
        viewBox="0 0 28 24"
        fill="none"
        style={{ animation: 'hero-fade-up 0.4s var(--landing-ease) 0s both' }}
      >
        <polygon
          points="1,23 14,1 27,23"
          stroke="rgba(212, 204, 192, 0.2)"
          strokeWidth="1"
          fill="none"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 14 12"
            to="360 14 12"
            begin="0s"
            dur="0.8s"
            fill="freeze"
          />
        </polygon>
      </svg>
      {/* Left vertical — bottom half (below triangle) */}
      <div
        className="pointer-events-none absolute top-[56%] left-[5%] h-[40%] w-px origin-top"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(212, 204, 192, 0.2) 15%, rgba(212, 204, 192, 0.2) 85%, transparent)',
          animation: 'hero-line-extend-y 0.8s var(--landing-ease) 0.7s both',
        }}
      />

      {/* Left horizontal — near top, crossing vertical */}
      <div
        className="pointer-events-none absolute top-[15%] left-[1.5%] h-px w-[18%] origin-left"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(212, 204, 192, 0.2) 15%, rgba(212, 204, 192, 0.2) 85%, transparent)',
          animation: 'hero-line-extend-x 0.6s var(--landing-ease) 0.75s both',
        }}
      />
      {/* Left horizontal — lower, shorter */}
      <div
        className="pointer-events-none absolute bottom-[8%] left-[2%] h-px w-[10%] origin-left"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(212, 204, 192, 0.2) 20%, rgba(212, 204, 192, 0.2) 80%, transparent)',
          animation: 'hero-line-extend-x 0.5s var(--landing-ease) 0.85s both',
        }}
      />

      {/* ═══ RIGHT SIDE ═══ */}

      {/* Right vertical — top half (above triangle), offset from left */}
      <div
        className="pointer-events-none absolute top-[10%] right-[4%] h-[34%] w-px origin-top"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(212, 204, 192, 0.2) 15%, rgba(212, 204, 192, 0.2) 85%, transparent)',
          animation: 'hero-line-extend-y 0.8s var(--landing-ease) 0.65s both',
        }}
      />
      {/* Right triangle */}
      <svg
        className="pointer-events-none absolute top-1/2 right-[4%] translate-x-1/2 -translate-y-1/2"
        width="28"
        height="24"
        viewBox="0 0 28 24"
        fill="none"
        style={{ animation: 'hero-fade-up 0.4s var(--landing-ease) 0.1s both' }}
      >
        <polygon
          points="1,23 14,1 27,23"
          stroke="rgba(212, 204, 192, 0.2)"
          strokeWidth="1"
          fill="none"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 14 12"
            to="360 14 12"
            begin="0.1s"
            dur="0.8s"
            fill="freeze"
          />
        </polygon>
      </svg>
      {/* Right vertical — bottom half (below triangle) */}
      <div
        className="pointer-events-none absolute top-[57%] right-[4%] h-[35%] w-px origin-top"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(212, 204, 192, 0.2) 15%, rgba(212, 204, 192, 0.2) 85%, transparent)',
          animation: 'hero-line-extend-y 0.8s var(--landing-ease) 0.72s both',
        }}
      />

      {/* Right horizontal — upper, wider than left */}
      <div
        className="pointer-events-none absolute top-[12%] right-[1%] h-px w-[22%] origin-right"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(212, 204, 192, 0.2) 15%, rgba(212, 204, 192, 0.2) 85%, transparent)',
          animation: 'hero-line-extend-x 0.6s var(--landing-ease) 0.78s both',
        }}
      />
      {/* Right horizontal — bottom area, different height from left */}
      <div
        className="pointer-events-none absolute bottom-[14%] right-[1.5%] h-px w-[14%] origin-right"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(212, 204, 192, 0.2) 20%, rgba(212, 204, 192, 0.2) 80%, transparent)',
          animation: 'hero-line-extend-x 0.5s var(--landing-ease) 0.88s both',
        }}
      />

      {/* ═══ SCATTERED ACCENT LINES ═══ */}

      {/* Inner-left vertical — shorter, offset */}
      <div
        className="pointer-events-none absolute top-[22%] left-[22%] h-[32%] w-px origin-top"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(212, 204, 192, 0.2) 15%, rgba(212, 204, 192, 0.2) 85%, transparent)',
          animation: 'hero-line-extend-y 0.7s var(--landing-ease) 0.9s both',
        }}
      />
      {/* Inner-right vertical — different height and position */}
      <div
        className="pointer-events-none absolute top-[30%] right-[18%] h-[25%] w-px origin-top"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(212, 204, 192, 0.2) 15%, rgba(212, 204, 192, 0.2) 85%, transparent)',
          animation: 'hero-line-extend-y 0.7s var(--landing-ease) 0.95s both',
        }}
      />
      {/* Mid-left horizontal — faint crossbar */}
      <div
        className="pointer-events-none absolute top-[35%] left-[8%] h-px w-[6%] origin-left"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(212, 204, 192, 0.2) 20%, rgba(212, 204, 192, 0.2) 80%, transparent)',
          animation: 'hero-line-extend-x 0.4s var(--landing-ease) 1.0s both',
        }}
      />
      {/* Upper-right horizontal — short accent */}
      <div
        className="pointer-events-none absolute top-[25%] right-[6%] h-px w-[8%] origin-right"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(212, 204, 192, 0.2) 20%, rgba(212, 204, 192, 0.2) 80%, transparent)',
          animation: 'hero-line-extend-x 0.4s var(--landing-ease) 1.02s both',
        }}
      />
      {/* Bottom-left short vertical */}
      <div
        className="pointer-events-none absolute bottom-[12%] left-[12%] h-[8%] w-px origin-bottom"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(212, 204, 192, 0.2) 20%, rgba(212, 204, 192, 0.2) 80%, transparent)',
          animation: 'hero-line-extend-y 0.4s var(--landing-ease) 1.05s both',
        }}
      />
    </>
  );
}
