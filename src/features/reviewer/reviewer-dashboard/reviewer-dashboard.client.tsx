"use client";

import { useReviewerDashboard } from "@/src/features/reviewer/hooks/useReviewerDashboard";
import { DashboardHeader } from "@/src/shared/components";
import type {
  AssignedReview,
  AssignedReviewExtended,
  CompletedReview,
  ReputationScores,
  ReputationBreakdownItem,
  UserProfile,
} from "@/src/features/reviewer/types";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { ResearchersInsights } from "./ResearchersInsights";
import { ReviewerProfileCard } from "./ReviewerProfileCard";
import { AssignedReviewsTable } from "./AssignedReviewsTable";
import { CompletedReviewsTable } from "./CompletedReviewsTable";
import { InviteCardList } from "../components/invite-card-list.client";

interface Props {
  initialAssigned: AssignedReview[];
  initialCompleted: CompletedReview[];
  reputationScores?: ReputationScores | null;
  reputationBreakdown?: ReputationBreakdownItem[] | null;
  userProfile?: UserProfile | null;
  journalsReviewed?: string[];
  averageDaysToDeadline?: number;
  extendedInvites?: AssignedReviewExtended[];
}

export function ReviewerDashboardClient({
  initialAssigned,
  initialCompleted,
  reputationScores: initialReputation,
  reputationBreakdown: initialBreakdown,
  userProfile,
  journalsReviewed = [],
  averageDaysToDeadline = 0,
}: Props) {
  const {
    hoveredRow,
    setHoveredRow,
    getUrgencyStyle,
    assignedReviews,
    completedReviews,
    reputationScores,
  } = useReviewerDashboard(initialAssigned, initialCompleted, initialReputation, initialBreakdown);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1816" }}>
      <div className="max-w-full mx-auto px-12 py-8">
        <DashboardHeader role="reviewer" />

        {/* Dashboard View */}
        <div className="mt-8 grid grid-cols-3 gap-8">
          {/* Left Column: Metrics and Insights */}
          <div className="col-span-2 space-y-8">
            {/* Performance Metrics */}
            <PerformanceMetrics
              reliabilityScore={reputationScores.overall}
              completedReviews={completedReviews.length}
              invites={initialAssigned.length}
              averageDaysToDeadline={averageDaysToDeadline}
            />

            {/* Reviewed For and Researchers Insights */}
            <ResearchersInsights
              journalsReviewed={journalsReviewed}
              insights={[
                "I found X's reviews very constructive. He is truly enthusiastic about his field.",
                "I found X's reviews very constructive. He is truly enthusiastic about his field.",
              ]}
            />
          </div>

          {/* Right Column: Profile Card */}
          <div>
            <ReviewerProfileCard
              name={userProfile?.displayName || "Reviewer Name"}
              affiliation={userProfile?.institution || "Affiliation"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function IncomingInvitesClient({
  initialAssigned,
  extendedInvites = [],
}: {
  initialAssigned: AssignedReview[];
  extendedInvites?: AssignedReviewExtended[];
}) {
  const pendingInvites = extendedInvites.filter((a) => a.status === "Pending");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1816" }}>
      <div className="max-w-full mx-auto px-12 py-8">
        <DashboardHeader role="reviewer" />

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: "#d4ccc0" }}>
            Incoming Invites ({pendingInvites.length})
          </h2>
          <InviteCardList invites={pendingInvites} />
        </div>
      </div>
    </div>
  );
}

export function PapersUnderReviewClient({
  initialAssigned,
}: {
  initialAssigned: AssignedReview[];
}) {
  const { hoveredRow, setHoveredRow, getUrgencyStyle } = useReviewerDashboard(
    initialAssigned,
    [],
    null,
    null
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1816" }}>
      <div className="max-w-full mx-auto px-12 py-8">
        <DashboardHeader role="reviewer" />

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#d4ccc0" }}>
            Papers Under Review ({initialAssigned.length})
          </h2>
          <AssignedReviewsTable
            reviews={initialAssigned}
            hoveredRow={hoveredRow}
            onHoverRow={setHoveredRow}
            getUrgencyStyle={getUrgencyStyle}
          />
        </div>
      </div>
    </div>
  );
}

export function CompletedPapersClient({
  initialCompleted,
}: {
  initialCompleted: CompletedReview[];
}) {
  const { hoveredRow, setHoveredRow } = useReviewerDashboard([], initialCompleted, null, null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1816" }}>
      <div className="max-w-full mx-auto px-12 py-8">
        <DashboardHeader role="reviewer" />

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: "#d4ccc0" }}>
            Completed Papers ({initialCompleted.length})
          </h2>
          <CompletedReviewsTable
            reviews={initialCompleted}
            hoveredRow={hoveredRow}
            onHoverRow={setHoveredRow}
          />
        </div>
      </div>
    </div>
  );
}
