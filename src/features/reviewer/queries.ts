import { cache } from 'react';
import { db } from '@/src/shared/lib/db';
import {
  reviewAssignments,
  reputationScores,
  users,
  journalReviewers,
  journals,
} from '@/src/shared/lib/db/schema';
import { eq, and, or, inArray } from 'drizzle-orm';
import { displayNameOrWallet } from '@/src/features/users/mappers';
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

/** Get pending pool invites for a reviewer. */
export const listPendingPoolInvites = cache(async (reviewerWallet: string) => {
  return db.query.journalReviewers.findMany({
    where: and(
      eq(journalReviewers.reviewerWallet, reviewerWallet.toLowerCase()),
      eq(journalReviewers.status, 'pending'),
    ),
    with: {
      journal: true,
    },
    orderBy: (a, { asc }) => [asc(a.addedAt)],
  });
});

/** Get all pool invites (pending + accepted + rejected) for a reviewer. */
export const listAllPoolInvites = cache(async (reviewerWallet: string) => {
  return db.query.journalReviewers.findMany({
    where: eq(journalReviewers.reviewerWallet, reviewerWallet.toLowerCase()),
    with: {
      journal: true,
    },
    orderBy: (a, { desc }) => [desc(a.addedAt)],
  });
});

export type DbPendingPoolInvite = Awaited<
  ReturnType<typeof listPendingPoolInvites>
>[number];
export type DbPoolInvite = Awaited<
  ReturnType<typeof listAllPoolInvites>
>[number];
export type DbCompletedReviewExtended = Awaited<
  ReturnType<typeof listCompletedReviewsExtended>
>[number];
export type DbReputationRow = NonNullable<
  Awaited<ReturnType<typeof getReviewerReputation>>
>;

/** Build editor wallet → displayName map from pool invites. */
export async function buildEditorNameMapFromPoolInvites(
  invites: Array<{ journal?: { editorWallet?: string } | null }>,
): Promise<Record<string, string>> {
  const wallets = [
    ...new Set(
      invites
        .map((i) => i.journal?.editorWallet?.toLowerCase())
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

  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.walletAddress.toLowerCase()] = displayNameOrWallet(
      row.displayName,
      row.walletAddress,
    );
  }
  return map;
}
