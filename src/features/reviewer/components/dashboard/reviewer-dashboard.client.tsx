'use client';

import { useState, useEffect } from 'react';
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
import { PerformanceMetrics } from '../../reviewer-dashboard/performance-metrics';
import { ResearchersInsights } from '../../reviewer-dashboard/researchers-insights';

const DEFAULT_REPUTATION_SCORES: ReputationScores = {
  overall: 4.4,
  change: 0.05,
  timeliness: 4.6,
  editorAvg: 4.4,
  authorAvg: 4.2,
  postPub: 4.8,
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
}

export function ReviewerDashboardClient({
  initialAssigned,
  initialCompleted,
  reputationScores: initialReputation,
  userProfile,
  journalsReviewed = [],
  averageDaysToDeadline = 0,
  researcherInsights = [],
}: Props) {
  const reputationScores = initialReputation ?? DEFAULT_REPUTATION_SCORES;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopyLink = async () => {
    if (!userProfile?.walletAddress) return;
    const url = `${window.location.origin}/api/reviewer-reputation?wallet=${userProfile.walletAddress}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  };

  return (
    <DashboardGridLayout
      role="reviewer"
      left={
        <>
          <PerformanceMetrics
            reliabilityScore={reputationScores.overall}
            completedReviews={initialCompleted.length}
            invites={initialAssigned.length}
            averageDaysToDeadline={averageDaysToDeadline}
          />
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
        >
          <button
            onClick={handleCopyLink}
            className="w-full rounded border px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{
              backgroundColor: copied
                ? 'rgba(143,188,143,0.2)'
                : 'rgba(100,90,75,0.2)',
              borderColor: copied
                ? 'rgba(143,188,143,0.6)'
                : 'rgba(180,160,130,0.4)',
              color: copied ? '#8fbc8f' : '#b0a898',
            }}
          >
            {copied ? 'Copied!' : 'Copy profile link'}
          </button>
        </ProfileCard>
      }
    />
  );
}
