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

export default async function ReviewerDashboard() {
  // wallet is guaranteed non-null by (protected)/layout.tsx
  const wallet = (await getSession())!;

  const [rawAssigned, rawCompleted, repRow] = await Promise.all([
    listAssignedReviews(wallet),
    listCompletedReviews(wallet),
    getReviewerReputation(wallet),
  ]);

  return (
    <ReviewerDashboardClient
      initialAssigned={rawAssigned.map(mapDbToAssignedReview)}
      initialCompleted={rawCompleted.map(mapDbToCompletedReview)}
      reputationScores={repRow ? mapDbToReputationScores(repRow) : null}
      reputationBreakdown={repRow ? mapDbToReputationBreakdown(repRow) : null}
    />
  );
}
