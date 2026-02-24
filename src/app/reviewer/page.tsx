"use client";

import { useReviewerDashboard } from "@/src/shared/hooks/useReviewerDashboard";
import {
  ReputationSection,
  TabBar,
  AssignedReviewsTable,
  CompletedReviewsTable,
  FeedbackPanel,
} from "@/src/features/reviewer/reviewer-dashboard";

export default function ReviewerDashboard() {
  const {
    activeTab,
    setActiveTab,
    hoveredRow,
    setHoveredRow,
    expandedHistory,
    setExpandedHistory,
    totalReviews,
    activeCount,
    overdueCount,
    averageUsefulness,
    tabs,
    getUrgencyStyle,
    getReviewForFeedback,
    assignedReviews,
    completedReviews,
    feedbackItems,
    reputationHistory,
    reputationBreakdown,
    reputationScores,
  } = useReviewerDashboard();

  return (
    <div className="max-w-[1200px] mx-auto px-10 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-normal italic text-[#e8e0d4] m-0 tracking-[0.5px]">
          Reviewer Dashboard
        </h1>
        <p className="text-[13px] text-[#6a6050] mt-1.5 italic">
          Track reviews, build reputation, view feedback
        </p>
      </div>

      {/* Reputation Score Card */}
      <ReputationSection
        overall={reputationScores.overall}
        change={reputationScores.change}
        history={reputationHistory}
        breakdown={reputationBreakdown}
        totalReviews={totalReviews}
        activeCount={activeCount}
        overdueCount={overdueCount}
        expandedHistory={expandedHistory}
        onToggleHistory={() => setExpandedHistory(!expandedHistory)}
      />

      {/* Tabs */}
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === "assigned" && (
        <AssignedReviewsTable
          reviews={assignedReviews}
          hoveredRow={hoveredRow}
          onHoverRow={setHoveredRow}
          getUrgencyStyle={getUrgencyStyle}
        />
      )}

      {activeTab === "completed" && (
        <CompletedReviewsTable
          reviews={completedReviews}
          hoveredRow={hoveredRow}
          onHoverRow={setHoveredRow}
        />
      )}

      {activeTab === "feedback" && (
        <FeedbackPanel
          feedbackItems={feedbackItems}
          averageUsefulness={averageUsefulness}
          getReviewForFeedback={getReviewForFeedback}
        />
      )}
    </div>
  );
}
