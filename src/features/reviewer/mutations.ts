import { db } from '@/src/shared/lib/db';
import { journalReviewers } from '@/src/shared/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import type { PoolInviteStatusDb } from '@/src/shared/lib/db/schema';

export async function respondToPoolInvite(
  journalReviewerId: string,
  reviewerWallet: string,
  status: 'accepted' | 'rejected',
) {
  const [row] = await db
    .update(journalReviewers)
    .set({
      status: status as PoolInviteStatusDb,
      respondedAt: sql`now()`,
    })
    .where(
      and(
        eq(journalReviewers.id, journalReviewerId),
        eq(journalReviewers.reviewerWallet, reviewerWallet.toLowerCase()),
      ),
    )
    .returning();
  return row;
}
