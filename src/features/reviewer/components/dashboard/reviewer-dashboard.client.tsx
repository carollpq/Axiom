'use client';

import { useMemo } from 'react';
import { DashboardGridLayout } from '@/src/shared/components/dashboard-grid-layout';
import { ProfileCard } from '@/src/shared/components/profile-card';
import type {
  AssignedReview,
  CompletedReview,
  ReputationScores,
  ReputationBreakdownItem,
  UserProfile,
  ResearcherInsight,
} from '@/src/features/reviewer/types/dashboard';
import { DashboardCard } from '@/src/shared/components/dashboard-card';
import { PerformanceMetrics } from '../../reviewer-dashboard/performance-metrics';
import { ResearchersInsights } from '../../reviewer-dashboard/researchers-insights';
import { BadgeCard, type BadgeData } from './badge-card.client';

const EMPTY_REPUTATION_SCORES: ReputationScores = {
  overall: 0,
  change: 0,
  timeliness: 0,
  editorAvg: 0,
  authorAvg: 0,
  postPub: 0,
};

interface Props {
  initialAssigned: AssignedReview[];
  initialCompleted: CompletedReview[];
  reputationScores?: ReputationScores | null;
  reputationBreakdown?: ReputationBreakdownItem[] | null;
  userProfile?: UserProfile | null;
  journalsReviewed?: string[];
  averageDaysToDeadline?: number;
  researcherInsights?: ResearcherInsight[];
  badges?: BadgeData[];
}

export function ReviewerDashboardClient({
  initialAssigned,
  initialCompleted,
  reputationScores: initialReputation,
  userProfile,
  journalsReviewed = [],
  averageDaysToDeadline = 0,
  researcherInsights = [],
  badges = [],
}: Props) {
  const reputationScores = initialReputation ?? EMPTY_REPUTATION_SCORES;
  const pendingCount = useMemo(
    () => initialAssigned.filter((a) => a.status === 'Pending').length,
    [initialAssigned],
  );
  const underReviewCount = useMemo(
    () =>
      initialAssigned.filter(
        (a) => a.status === 'In Progress' || a.status === 'Late',
      ).length,
    [initialAssigned],
  );
  return (
    <DashboardGridLayout
      role="reviewer"
      left={
        <>
          <PerformanceMetrics
            reliabilityScore={reputationScores.overall}
            completedReviews={initialCompleted.length}
            invites={pendingCount}
            underReview={underReviewCount}
            averageDaysToDeadline={averageDaysToDeadline}
          />
          {badges.length > 0 && (
            <DashboardCard className="space-y-4">
              <h3 className="text-lg font-bold" style={{ color: '#d4ccc0' }}>
                Achievements
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {badges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            </DashboardCard>
          )}
          <ResearchersInsights
            journalsReviewed={journalsReviewed}
            insights={researcherInsights.map((i) => i.comment)}
          />
        </>
      }
      right={
        <ProfileCard
          name={userProfile?.displayName || 'Reviewer Name'}
          subtitle={userProfile?.institution || 'Affiliation'}
        />
      }
    />
  );
}
