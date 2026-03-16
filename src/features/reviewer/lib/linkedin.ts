const APP_DOMAIN =
  process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'http://localhost:3000';

export interface LinkedInBadgeParams {
  badgeId: string;
  achievementName: string;
  issuedAt: string; // ISO date string
}

/**
 * Builds a LinkedIn "Add to Profile" URL that pre-fills the certification form.
 * Uses LinkedIn's deep link: linkedin.com/profile/add?startTask=CERTIFICATION_NAME
 * No API keys or partnership required.
 */
export function buildLinkedInAddUrl(params: LinkedInBadgeParams): string {
  const date = new Date(params.issuedAt);

  const query = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: `${params.achievementName} — Axiom`,
    organizationName: 'Axiom Academic Review',
    issueYear: String(date.getFullYear()),
    issueMonth: String(date.getMonth() + 1),
    certUrl: `${APP_DOMAIN}/api/badges/${params.badgeId}`,
    certId: params.badgeId,
  });

  return `https://www.linkedin.com/profile/add?${query.toString()}`;
}
