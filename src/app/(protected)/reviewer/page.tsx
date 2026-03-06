import { getSession } from "@/src/shared/lib/auth/auth";
import {
  listAssignedReviews,
  listCompletedReviews,
  getReviewerReputation,
} from "@/src/features/reviewer/queries";
import {
  mapDbToAssignedReview,
  mapDbToCompletedReview,
  mapDbToReputationScores,
  mapDbToReputationBreakdown,
} from "@/src/features/reviewer/mappers/reviewer";
import { ReviewerDashboardClient } from "@/src/features/reviewer/reviewer-dashboard/reviewer-dashboard.client";
import { getUserByWallet } from "@/src/features/users/queries";
import { listRatingsForReviewer } from "@/src/features/reviews/queries";
import type { ResearcherInsight } from "@/src/features/reviewer/types";

export default async function ReviewerDashboard() {
  // wallet is guaranteed non-null by (protected)/layout.tsx
  const wallet = (await getSession())!;

  const [rawAssigned, rawCompleted, repRow, userProfile, ratings] = await Promise.all([
    listAssignedReviews(wallet),
    listCompletedReviews(wallet),
    getReviewerReputation(wallet),
    getUserByWallet(wallet),
    listRatingsForReviewer(wallet),
  ]);

  // Extract unique journals from assigned and completed reviews
  const journalsReviewed = new Set<string>();
  rawAssigned.forEach((a) => {
    if (a.submission.journal?.name) journalsReviewed.add(a.submission.journal.name);
  });
  rawCompleted.forEach((c) => {
    if (c.submission.journal?.name) journalsReviewed.add(c.submission.journal.name);
  });

  // Calculate average days to deadline for assigned reviews with deadlines
  let averageDaysToDeadline = 0;
  const assignedWithDeadlines = rawAssigned.filter((a) => a.deadline);
  if (assignedWithDeadlines.length > 0) {
    const totalDays = assignedWithDeadlines.reduce((sum, a) => {
      const daysLeft = Math.max(0, Math.ceil((new Date(a.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      return sum + daysLeft;
    }, 0);
    averageDaysToDeadline = Math.round((totalDays / assignedWithDeadlines.length) * 10) / 10;
  }

  // Extract researcher insights (comments from ratings)
  const researcherInsights: ResearcherInsight[] = ratings
    .filter((r) => r.comment)
    .map((r) => ({
      reviewId: r.reviewId,
      comment: r.comment!,
      overallRating: r.overallRating,
      createdAt: r.createdAt,
    }));

  return (
    <ReviewerDashboardClient
      initialAssigned={rawAssigned.map(mapDbToAssignedReview)}
      initialCompleted={rawCompleted.map(mapDbToCompletedReview)}
      reputationScores={repRow ? mapDbToReputationScores(repRow) : null}
      reputationBreakdown={repRow ? mapDbToReputationBreakdown(repRow) : null}
      userProfile={userProfile}
      journalsReviewed={Array.from(journalsReviewed)}
      averageDaysToDeadline={averageDaysToDeadline}
      researcherInsights={researcherInsights}
    />
  );
}
