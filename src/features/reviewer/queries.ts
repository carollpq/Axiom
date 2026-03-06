import { cache } from "react";
import { db } from "@/src/shared/lib/db";
import { reviewAssignments, reputationScores } from "@/src/shared/lib/db/schema";
import { eq, and, or } from "drizzle-orm";

export const listAssignedReviews = cache(async (reviewerWallet: string) => {
  return db.query.reviewAssignments.findMany({
    where: and(
      eq(reviewAssignments.reviewerWallet, reviewerWallet.toLowerCase()),
      or(
        eq(reviewAssignments.status, "assigned"),
        eq(reviewAssignments.status, "accepted"),
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
      eq(reviewAssignments.status, "submitted"),
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
export const listCompletedReviewsExtended = cache(async (reviewerWallet: string) => {
  return db.query.reviewAssignments.findMany({
    where: and(
      eq(reviewAssignments.reviewerWallet, reviewerWallet.toLowerCase()),
      eq(reviewAssignments.status, "submitted"),
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
});

export const getReviewerReputation = cache(async (reviewerWallet: string) => {
  return db.query.reputationScores.findFirst({
    where: eq(reputationScores.userWallet, reviewerWallet.toLowerCase()),
  });
});

export type DbAssignedReview = Awaited<ReturnType<typeof listAssignedReviews>>[number];
export type DbCompletedReview = Awaited<ReturnType<typeof listCompletedReviews>>[number];
export type DbCompletedReviewExtended = Awaited<ReturnType<typeof listCompletedReviewsExtended>>[number];
export type DbReputationRow = NonNullable<Awaited<ReturnType<typeof getReviewerReputation>>>;
