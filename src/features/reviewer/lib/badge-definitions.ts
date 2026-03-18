import { db } from '@/src/shared/lib/db';
import { badges, reputationScores } from '@/src/shared/lib/db/schema';
import { eq } from 'drizzle-orm';
import { BADGE_DEFINITIONS, type ReviewerStats } from './badge-config';

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
