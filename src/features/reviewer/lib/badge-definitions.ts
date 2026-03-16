import { db } from '@/src/shared/lib/db';
import {
  badges,
  reputationScores,
  type BadgeTypeDb,
} from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface BadgeDefinition {
  type: BadgeTypeDb;
  name: string;
  description: string;
  /** Check whether this badge should be awarded given the reviewer's current stats. */
  check: (stats: ReviewerStats) => boolean;
}

export interface ReviewerStats {
  reviewCount: number;
  overallScore: number;
  timelinessScore: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: 'first_review',
    name: 'First Review Completed',
    description: 'Completed your first peer review on Axiom.',
    check: (s) => s.reviewCount >= 1,
  },
  {
    type: 'five_reviews',
    name: '5 Reviews Completed',
    description: 'Completed 5 peer reviews on Axiom.',
    check: (s) => s.reviewCount >= 5,
  },
  {
    type: 'ten_reviews',
    name: '10 Reviews Completed',
    description: 'Completed 10 peer reviews on Axiom.',
    check: (s) => s.reviewCount >= 10,
  },
  {
    type: 'twentyfive_reviews',
    name: '25 Reviews Completed',
    description: 'Completed 25 peer reviews on Axiom.',
    check: (s) => s.reviewCount >= 25,
  },
  {
    type: 'high_reputation',
    name: 'High Reputation Reviewer',
    description: 'Achieved an overall reputation score of 80 or above.',
    check: (s) => s.overallScore >= 80,
  },
  {
    type: 'timely_reviewer',
    name: 'Timely Reviewer',
    description: 'Maintained a timeliness score of 90 or above.',
    check: (s) => s.timelinessScore >= 90,
  },
];

/**
 * Checks all badge thresholds and issues any newly earned badges.
 * Returns the list of newly created badge IDs.
 */
export async function checkAndIssueBadges(wallet: string): Promise<string[]> {
  const normalizedWallet = wallet.toLowerCase();

  const [scores, existingBadges] = await Promise.all([
    db.query.reputationScores.findFirst({
      where: eq(reputationScores.userWallet, normalizedWallet),
    }),
    db
      .select({ badgeType: badges.badgeType })
      .from(badges)
      .where(eq(badges.userWallet, normalizedWallet)),
  ]);

  if (!scores) return [];

  const stats: ReviewerStats = {
    reviewCount: scores.reviewCount,
    overallScore: scores.overallScore,
    timelinessScore: scores.timelinessScore,
  };

  const existingTypes = new Set(existingBadges.map((b) => b.badgeType));
  const newBadgeIds: string[] = [];

  for (const def of BADGE_DEFINITIONS) {
    if (existingTypes.has(def.type)) continue;
    if (!def.check(stats)) continue;

    const [inserted] = await db
      .insert(badges)
      .values({
        userWallet: normalizedWallet,
        badgeType: def.type,
        achievementName: def.name,
        metadata: {
          description: def.description,
          reviewCount: stats.reviewCount,
          overallScore: stats.overallScore,
          timelinessScore: stats.timelinessScore,
        },
      })
      .returning({ id: badges.id });

    if (inserted) newBadgeIds.push(inserted.id);
  }

  return newBadgeIds;
}

/** Fetches all badges for a given wallet. */
export async function getBadgesForWallet(wallet: string) {
  return db
    .select()
    .from(badges)
    .where(eq(badges.userWallet, wallet.toLowerCase()));
}
