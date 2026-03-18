'use client';

import type { ReactNode } from 'react';
import { buildLinkedInAddUrl } from '@/src/features/reviewer/lib/linkedin';
import { BADGE_DEFINITIONS } from '@/src/features/reviewer/lib/badge-config';

export interface BadgeData {
  id: string;
  badgeType: string;
  achievementName: string;
  issuedAt: string;
  metadata: Record<string, unknown> | null;
}

/* ── Hoisted style constants ─────────────────────────────── */

const EARNED_CARD_STYLE = {
  backgroundColor: 'var(--surface-stat)',
  borderColor: 'rgba(201,164,74,0.4)',
} as const;

const EARNED_ICON_STYLE = {
  backgroundColor: 'rgba(201,164,74,0.2)',
  color: 'var(--accent-gold)',
  border: '2px solid rgba(201,164,74,0.5)',
} as const;

const LOCKED_CARD_STYLE = {
  backgroundColor: 'var(--surface-stat)',
  borderColor: 'rgba(120,110,95,0.25)',
} as const;

const LOCKED_ICON_STYLE = {
  backgroundColor: 'rgba(120,110,95,0.15)',
  color: '#6a6050',
  border: '2px solid rgba(120,110,95,0.3)',
} as const;

const LINKEDIN_STYLE = {
  background: 'rgba(90,122,154,0.15)',
  border: '1px solid rgba(90,122,154,0.3)',
  color: 'var(--accent-blue)',
} as const;

/* ── Shared card shell ───────────────────────────────────── */

function BadgeCardShell({
  icon,
  name,
  subtitle,
  description,
  locked,
  actions,
}: {
  icon: string;
  name: string;
  subtitle: string;
  description: string;
  locked?: boolean;
  actions?: ReactNode;
}) {
  return (
    <div
      data-testid={locked ? undefined : 'badge-card'}
      className={`rounded-lg border p-4 space-y-3${locked ? ' opacity-40' : ''}`}
      style={locked ? LOCKED_CARD_STYLE : EARNED_CARD_STYLE}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={locked ? LOCKED_ICON_STYLE : EARNED_ICON_STYLE}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h4
            className={`text-sm font-semibold truncate ${locked ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}
          >
            {name}
          </h4>
          <p
            className={`text-xs ${locked ? 'text-[var(--text-faint)]' : 'text-[var(--text-subtle)]'}`}
          >
            {subtitle}
          </p>
        </div>
      </div>

      <p
        className={`text-xs leading-relaxed ${locked ? 'text-[var(--text-faint)]' : 'text-[var(--text-muted)]'}`}
      >
        {description}
      </p>

      {actions}
    </div>
  );
}

/* ── Public components ───────────────────────────────────── */

export function BadgeCard({ badge }: { badge: BadgeData }) {
  const def = BADGE_DEFINITIONS.find((d) => d.type === badge.badgeType);
  const description =
    (badge.metadata?.description as string) ?? 'Axiom achievement';
  const linkedInUrl = buildLinkedInAddUrl({
    badgeId: badge.id,
    achievementName: badge.achievementName,
    issuedAt: badge.issuedAt,
  });

  return (
    <BadgeCardShell
      icon={def?.icon ?? '?'}
      name={badge.achievementName}
      subtitle={new Date(badge.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })}
      description={description}
      actions={
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded px-3 py-1.5 text-[12px] font-serif cursor-pointer hover:opacity-80"
          style={LINKEDIN_STYLE}
        >
          <LinkedInIcon />
          Add to LinkedIn
        </a>
      }
    />
  );
}

/** Shows all badges — earned ones in full, unearned as locked. */
export function BadgeGrid({ earned }: { earned: BadgeData[] }) {
  return (
    <div className="grid gap-3">
      {BADGE_DEFINITIONS.map((def) => {
        const badge = earned.find((b) => b.badgeType === def.type);
        return badge ? (
          <BadgeCard key={badge.id} badge={badge} />
        ) : (
          <BadgeCardShell
            key={def.type}
            icon={def.icon}
            name={def.name}
            subtitle="Locked"
            description={def.description}
            locked
          />
        );
      })}
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
