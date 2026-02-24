"use client";

import { useReviewerDashboard } from "@/src/shared/hooks/useReviewerDashboard";
import { DashboardHeader } from "@/src/shared/components";
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
      <DashboardHeader role="reviewer" />

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
