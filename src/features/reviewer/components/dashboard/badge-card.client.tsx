'use client';

import { buildLinkedInAddUrl } from '@/src/features/reviewer/lib/linkedin';

export interface BadgeData {
  id: string;
  badgeType: string;
  achievementName: string;
  issuedAt: string;
  metadata: Record<string, unknown> | null;
}

const BADGE_ICONS: Record<string, string> = {
  first_review: '1',
  five_reviews: '5',
  ten_reviews: '10',
  twentyfive_reviews: '25',
  high_reputation: 'S',
  timely_reviewer: 'T',
};

export function BadgeCard({ badge }: { badge: BadgeData }) {
  const icon = BADGE_ICONS[badge.badgeType] ?? '?';
  const description =
    (badge.metadata?.description as string) ?? 'Axiom achievement';
  const linkedInUrl = buildLinkedInAddUrl({
    badgeId: badge.id,
    achievementName: badge.achievementName,
    issuedAt: badge.issuedAt,
  });

  return (
    <div
      data-testid="badge-card"
      className="rounded-lg border p-4 space-y-3"
      style={{
        backgroundColor: 'var(--surface-stat)',
        borderColor: 'rgba(201,164,74,0.4)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{
            backgroundColor: 'rgba(201,164,74,0.2)',
            color: 'var(--accent-gold)',
            border: '2px solid rgba(201,164,74,0.5)',
          }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold truncate text-[var(--text-secondary)]">
            {badge.achievementName}
          </h4>
          <p className="text-xs text-[var(--text-subtle)]">
            {new Date(badge.issuedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>

      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded px-3 py-1.5 text-[12px] font-serif cursor-pointer hover:opacity-80"
        style={{
          background: 'rgba(90,122,154,0.15)',
          border: '1px solid rgba(90,122,154,0.3)',
          color: 'var(--accent-blue)',
        }}
      >
        <LinkedInIcon />
        Add to LinkedIn
      </a>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
