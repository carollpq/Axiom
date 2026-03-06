"use client";

import { DashboardHeader } from "@/src/shared/components";
import type {
  AssignedReview,
  CompletedReview,
  ReputationScores,
  ReputationBreakdownItem,
  UserProfile,
  ResearcherInsight,
} from "@/src/features/reviewer/types";
import { PerformanceMetrics } from "../../reviewer-dashboard/PerformanceMetrics";
import { ResearchersInsights } from "../../reviewer-dashboard/ResearchersInsights";
import { ReviewerProfileCard } from "../../reviewer-dashboard/ReviewerProfileCard";

const DEFAULT_REPUTATION_SCORES: ReputationScores = {
  overall: 4.4, change: 0.05, timeliness: 4.6,
  editorAvg: 4.4, authorAvg: 4.2, postPub: 4.8,
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1816" }}>
      <div className="max-w-full mx-auto px-12 py-8">
        <DashboardHeader role="reviewer" />

        <div className="mt-8 grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
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
          </div>

          <div>
            <ReviewerProfileCard
              name={userProfile?.displayName || "Reviewer Name"}
              affiliation={userProfile?.institution || "Affiliation"}
              walletAddress={userProfile?.walletAddress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
