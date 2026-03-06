import { db } from "@/src/shared/lib/db";
import { reviewAssignments, reputationScores } from "@/src/shared/lib/db/schema";
import { eq, and, or } from "drizzle-orm";

export async function listAssignedReviews(reviewerWallet: string) {
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
}

export async function listCompletedReviews(reviewerWallet: string) {
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
}

export async function getReviewerReputation(reviewerWallet: string) {
  return db.query.reputationScores.findFirst({
    where: eq(reputationScores.userWallet, reviewerWallet.toLowerCase()),
  });
}

export type DbAssignedReview = Awaited<ReturnType<typeof listAssignedReviews>>[number];
export type DbCompletedReview = Awaited<ReturnType<typeof listCompletedReviews>>[number];
export type DbReputationRow = NonNullable<Awaited<ReturnType<typeof getReviewerReputation>>>;
