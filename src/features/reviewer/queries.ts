import { cache } from 'react';
import { db } from '@/src/shared/lib/db';
import {
  reviewAssignments,
  reputationScores,
  users,
} from '@/src/shared/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { displayNameOrWallet } from '@/src/shared/lib/format';
import type { EditorNameMap } from '@/src/features/reviewer/mappers/dashboard';

export const listAssignedReviews = cache(async (reviewerWallet: string) => {
  return db.query.reviewAssignments.findMany({
    where: and(
      eq(reviewAssignments.reviewerWallet, reviewerWallet.toLowerCase()),
      or(
        eq(reviewAssignments.status, 'assigned'),
        eq(reviewAssignments.status, 'accepted'),
      ),
    ),
    with: {
      submission: {
        with: {
          paper: {
            with: {
              versions: true,
              contracts: {
                with: { contributors: true },
              },
            },
          },
          journal: true,
          reviewCriteria: true,
        },
      },
    },
    orderBy: (a, { asc }) => [asc(a.deadline)],
  });
});

/** Pending invites only — assignments not yet accepted/declined. */
export const listPendingInvites = cache(async (reviewerWallet: string) => {
  return db.query.reviewAssignments.findMany({
    where: and(
      eq(reviewAssignments.reviewerWallet, reviewerWallet.toLowerCase()),
      eq(reviewAssignments.status, 'assigned'),
    ),
    with: {
      submission: {
        with: {
          paper: {
            with: {
              versions: true,
              contracts: {
                with: { contributors: true },
              },
            },
          },
          journal: true,
          reviewCriteria: true,
        },
      },
    },
    orderBy: (a, { asc }) => [asc(a.deadline)],
  });
});

/** Lightweight query for dashboard counts — no contracts/reviews/rebuttals. */
export const listCompletedReviews = cache(async (reviewerWallet: string) => {
  return db.query.reviewAssignments.findMany({
    where: and(
      eq(reviewAssignments.reviewerWallet, reviewerWallet.toLowerCase()),
      eq(reviewAssignments.status, 'submitted'),
    ),
    with: {
      submission: {
        with: {
          paper: { with: { versions: true } },
          journal: true,
        },
      },
    },
    orderBy: (a, { desc }) => [desc(a.submittedAt)],
  });
});

/** Full query for completed page — includes contracts, reviews, rebuttals. */
export const listCompletedReviewsExtended = cache(
  async (reviewerWallet: string) => {
    return db.query.reviewAssignments.findMany({
      where: and(
        eq(reviewAssignments.reviewerWallet, reviewerWallet.toLowerCase()),
        eq(reviewAssignments.status, 'submitted'),
      ),
      with: {
        submission: {
          with: {
            paper: {
              with: {
                versions: true,
                contracts: {
                  with: { contributors: true },
                },
              },
            },
            journal: true,
            rebuttals: {
              with: { responses: true },
            },
          },
        },
        reviews: true,
      },
      orderBy: (a, { desc }) => [desc(a.submittedAt)],
    });
  },
);

export const getReviewerReputation = cache(async (reviewerWallet: string) => {
  return db.query.reputationScores.findFirst({
    where: eq(reputationScores.userWallet, reviewerWallet.toLowerCase()),
  });
});

/** Build a wallet→displayName map for editor wallets found in assignments. */
export async function buildEditorNameMap(
  assignments: Array<{
    submission: { journal?: { editorWallet?: string } | null };
  }>,
): Promise<EditorNameMap> {
  const wallets = [
    ...new Set(
      assignments
        .map((a) => a.submission.journal?.editorWallet?.toLowerCase())
        .filter((w): w is string => !!w),
    ),
  ];
  if (wallets.length === 0) return {};

  const rows = await db
    .select({
      walletAddress: users.walletAddress,
      displayName: users.displayName,
    })
    .from(users)
    .where(inArray(users.walletAddress, wallets));

  const map: EditorNameMap = {};
  for (const row of rows) {
    map[row.walletAddress.toLowerCase()] = displayNameOrWallet(
      row.displayName,
      row.walletAddress,
    );
  }
  return map;
}

export type DbAssignedReview = Awaited<
  ReturnType<typeof listAssignedReviews>
>[number];
export type DbCompletedReview = Awaited<
  ReturnType<typeof listCompletedReviews>
>[number];
export type DbCompletedReviewExtended = Awaited<
  ReturnType<typeof listCompletedReviewsExtended>
>[number];
export type DbReputationRow = NonNullable<
  Awaited<ReturnType<typeof getReviewerReputation>>
>;
