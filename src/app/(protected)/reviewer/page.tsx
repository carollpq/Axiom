import { getSession } from '@/src/shared/lib/auth/auth';
import {
  listAssignedReviews,
  listCompletedReviews,
  getReviewerReputation,
  getRecentReputationDelta,
} from '@/src/features/reviewer/queries';
import {
  mapDbToAssignedReview,
  mapDbToCompletedReview,
  mapDbToReputationScores,
  mapDbToReputationBreakdown,
  computeAvgDaysToDeadline,
  extractJournalNames,
  mapRatingsToInsights,
} from '@/src/features/reviewer/lib/dashboard';
import { ReviewerDashboardClient } from '@/src/features/reviewer/components/dashboard/reviewer-dashboard.client';
import { getUserByWallet } from '@/src/features/users/queries';
import { listRatingsForReviewer } from '@/src/features/reviews/queries';
import { getBadgesForWallet } from '@/src/features/reviewer/lib/badge-definitions';

export default async function ReviewerDashboard() {
  const wallet = (await getSession())!;

  const [
    rawAssigned,
    rawCompleted,
    repRow,
    userProfile,
    ratings,
    badgeRows,
    recentDelta,
  ] = await Promise.all([
    listAssignedReviews(wallet),
    listCompletedReviews(wallet),
    getReviewerReputation(wallet),
    getUserByWallet(wallet),
    listRatingsForReviewer(wallet),
    getBadgesForWallet(wallet),
    getRecentReputationDelta(wallet),
  ]);

  return (
    <div className="max-w-full mx-auto px-12 py-8">
      <ReviewerDashboardClient
        initialAssigned={rawAssigned.map(mapDbToAssignedReview)}
        initialCompleted={rawCompleted.map(mapDbToCompletedReview)}
        reputationScores={
          repRow ? mapDbToReputationScores(repRow, recentDelta) : null
        }
        reputationBreakdown={repRow ? mapDbToReputationBreakdown(repRow) : null}
        userProfile={userProfile}
        journalsReviewed={extractJournalNames(rawAssigned, rawCompleted)}
        averageDaysToDeadline={computeAvgDaysToDeadline(rawAssigned)}
        researcherInsights={mapRatingsToInsights(ratings)}
        badges={badgeRows.map((b) => ({
          id: b.id,
          badgeType: b.badgeType,
          achievementName: b.achievementName,
          issuedAt: b.issuedAt,
          metadata: b.metadata ?? null,
        }))}
      />
    </div>
  );
}
