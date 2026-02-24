import { db } from "@/src/shared/lib/db";

export async function listAssignedReviews(reviewerWallet: string) {
  const all = await db.query.submissions.findMany({
    with: { paper: true, journal: true },
  });
  return all.filter(
    (s) =>
      s.status === "under_review" &&
      (s.reviewerWallets as string[] | null ?? []).includes(reviewerWallet),
  );
}

export async function listCompletedReviews(reviewerWallet: string) {
  const all = await db.query.submissions.findMany({
    with: { paper: { with: { versions: true } }, journal: true },
  });
  return all.filter(
    (s) =>
      (s.status === "published" || s.status === "rejected") &&
      (s.reviewerWallets as string[] | null ?? []).includes(reviewerWallet),
  );
}

export type DbAssignedReview = Awaited<ReturnType<typeof listAssignedReviews>>[number];
export type DbCompletedReview = Awaited<ReturnType<typeof listCompletedReviews>>[number];
