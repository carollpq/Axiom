import { getSession } from '@/src/shared/lib/auth/auth';
import {
  listAssignedReviews,
  listCompletedReviews,
  getReviewerReputation,
} from '@/src/features/reviewer/queries';
import {
  mapDbToAssignedReview,
  mapDbToCompletedReview,
  mapDbToReputationScores,
  mapDbToReputationBreakdown,
} from '@/src/features/reviewer/lib/dashboard';
import { ReviewerDashboardClient } from '@/src/features/reviewer/components/dashboard/reviewer-dashboard.client';
import { getUserByWallet } from '@/src/features/users/queries';
import { listRatingsForReviewer } from '@/src/features/reviews/queries';
import type { ResearcherInsight } from '@/src/features/reviewer/types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function computeAvgDaysToDeadline(
  assignments: { deadline?: string | null }[],
): number {
  const withDeadlines = assignments.filter((a) => a.deadline);
  if (withDeadlines.length === 0) return 0;
  const now = Date.now();
  const totalDays = withDeadlines.reduce((sum, a) => {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(a.deadline!).getTime() - now) / MS_PER_DAY),
    );
    return sum + daysLeft;
  }, 0);
  return Math.round((totalDays / withDeadlines.length) * 10) / 10;
}

export default async function ReviewerDashboard() {
  // wallet is guaranteed non-null by (protected)/layout.tsx
  const wallet = (await getSession())!;

  const [rawAssigned, rawCompleted, repRow, userProfile, ratings] =
    await Promise.all([
      listAssignedReviews(wallet),
      listCompletedReviews(wallet),
      getReviewerReputation(wallet),
      getUserByWallet(wallet),
      listRatingsForReviewer(wallet),
    ]);

  // Extract unique journals from assigned and completed reviews
  const journalsReviewed = new Set<string>();
  rawAssigned.forEach((a) => {
    if (a.submission.journal?.name)
      journalsReviewed.add(a.submission.journal.name);
  });
  rawCompleted.forEach((c) => {
    if (c.submission.journal?.name)
      journalsReviewed.add(c.submission.journal.name);
  });

  const averageDaysToDeadline = computeAvgDaysToDeadline(rawAssigned);

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
    <div className="max-w-full mx-auto px-12 py-8">
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
    </div>
  );
}
