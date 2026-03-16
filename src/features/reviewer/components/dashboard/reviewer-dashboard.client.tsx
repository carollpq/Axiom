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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopyLink = async () => {
    if (!userProfile?.walletAddress) return;
    const url = `${window.location.origin}/reviewer-profile/${userProfile.walletAddress}`;
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
