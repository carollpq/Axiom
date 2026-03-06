"use client";

import { useState } from "react";
import { useReviewerDashboard } from "@/src/features/reviewer/hooks/useReviewerDashboard";
import { DashboardHeader } from "@/src/shared/components";
import { ThreeColumnLayout } from "@/src/shared/components/ThreeColumnLayout";
import { DynamicPdfViewer } from "@/src/shared/components/DynamicPdfViewer";
import { useCollapseSidebar } from "@/src/shared/hooks/useCollapseSidebar";
import type {
  AssignedReview,
  AssignedReviewExtended,
  CompletedReview,
  CompletedReviewExtended,
  ReputationScores,
  ReputationBreakdownItem,
  UserProfile,
  ResearcherInsight,
} from "@/src/features/reviewer/types";
import { PerformanceMetrics } from "./PerformanceMetrics";
import { ResearchersInsights } from "./ResearchersInsights";
import { ReviewerProfileCard } from "./ReviewerProfileCard";
import { InviteCardList } from "../components/invite-card-list.client";
import { ReviewerPaperList } from "../components/reviewer-paper-list";
import { AssignedReviewSidebar } from "../components/assigned-review-sidebar";
import { CompletedReviewSidebar } from "../components/completed-review-sidebar";
import { CoursesCarousel } from "../components/courses-carousel";

interface Props {
  initialAssigned: AssignedReview[];
  initialCompleted: CompletedReview[];
  reputationScores?: ReputationScores | null;
  reputationBreakdown?: ReputationBreakdownItem[] | null;
  userProfile?: UserProfile | null;
  journalsReviewed?: string[];
  averageDaysToDeadline?: number;
  extendedInvites?: AssignedReviewExtended[];
  researcherInsights?: ResearcherInsight[];
}

export function ReviewerDashboardClient({
  initialAssigned,
  initialCompleted,
  reputationScores: initialReputation,
  reputationBreakdown: initialBreakdown,
  userProfile,
  journalsReviewed = [],
  averageDaysToDeadline = 0,
  researcherInsights = [],
}: Props) {
  const {
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
              insights={researcherInsights.map((i) => i.comment)}
            />
          </div>

          {/* Right Column: Profile Card */}
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

export function IncomingInvitesClient({
  extendedInvites = [],
}: {
  initialAssigned?: AssignedReview[];
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
  initialAssigned: AssignedReviewExtended[];
}) {
  useCollapseSidebar();
  const [selectedId, setSelectedId] = useState<number | null>(
    initialAssigned.length > 0 ? initialAssigned[0].id : null,
  );

  const selected = initialAssigned.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1816" }}>
      <ThreeColumnLayout
        title="Papers Under Review"
        countLabel={`${initialAssigned.length} paper${initialAssigned.length !== 1 ? "s" : ""}`}
        list={
          <ReviewerPaperList
            papers={initialAssigned}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        }
        viewer={
          selected?.pdfUrl ? (
            <DynamicPdfViewer fileUrl={selected.pdfUrl} />
          ) : (
            <div className="flex items-center justify-center h-full text-[12px] text-[#6a6050] font-serif">
              {selected ? "No PDF available" : "Select a paper to view"}
            </div>
          )
        }
        sidebar={
          selected ? (
            <AssignedReviewSidebar paper={selected} />
          ) : (
            <div className="p-4 text-[12px] text-[#6a6050]">
              Select a paper to see details
            </div>
          )
        }
        sidebarTitle="Review Details"
      />
    </div>
  );
}

export function CompletedPapersClient({
  initialCompleted,
}: {
  initialCompleted: CompletedReviewExtended[];
}) {
  useCollapseSidebar();
  const [selectedId, setSelectedId] = useState<number | null>(
    initialCompleted.length > 0 ? initialCompleted[0].id : null,
  );

  const selected = initialCompleted.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#1a1816" }}>
      {/* Courses Carousel */}
      <div className="px-5 pt-4">
        <CoursesCarousel />
      </div>

      <ThreeColumnLayout
        title="Completed Reviews"
        countLabel={`${initialCompleted.length} review${initialCompleted.length !== 1 ? "s" : ""}`}
        list={
          <ReviewerPaperList
            papers={initialCompleted}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        }
        viewer={
          selected?.pdfUrl ? (
            <DynamicPdfViewer fileUrl={selected.pdfUrl} />
          ) : (
            <div className="flex items-center justify-center h-full text-[12px] text-[#6a6050] font-serif">
              {selected ? "No PDF available" : "Select a paper to view"}
            </div>
          )
        }
        sidebar={
          selected ? (
            <CompletedReviewSidebar paper={selected} />
          ) : (
            <div className="p-4 text-[12px] text-[#6a6050]">
              Select a paper to see your review
            </div>
          )
        }
        sidebarTitle="Review Summary"
      />
    </div>
  );
}
