"use client";

import { useState, useMemo } from "react";
import type {
  ReviewerTab,
  ReviewerTabConfig,
  AssignedReview,
  CompletedReview,
  FeedbackItem,
  ReputationDataPoint,
  ReputationBreakdownItem,
  ReputationScores,
} from "@/src/shared/types/reviewer-dashboard";

// Placeholder reputation data — requires reputationEvents table to be real
const PLACEHOLDER_REPUTATION_HISTORY: ReputationDataPoint[] = [
  { month: "Sep 2025", score: 4.1 },
  { month: "Oct 2025", score: 4.2 },
  { month: "Nov 2025", score: 4.3 },
  { month: "Dec 2025", score: 4.2 },
  { month: "Jan 2026", score: 4.35 },
  { month: "Feb 2026", score: 4.4 },
];

const PLACEHOLDER_REPUTATION_BREAKDOWN: ReputationBreakdownItem[] = [
  { label: "Timeliness",       value: 4.6, desc: "Avg days to deadline" },
  { label: "Editor Ratings",   value: 4.4, desc: "From journal editors" },
  { label: "Author Feedback",  value: 4.2, desc: "Anonymous aggregate" },
  { label: "Post-Publication", value: 4.8, desc: "No retractions impact" },
];

const PLACEHOLDER_REPUTATION_SCORES: ReputationScores = {
  overall: 4.4, change: 0.05, timeliness: 4.6,
  editorAvg: 4.4, authorAvg: 4.2, postPub: 4.8,
};

// Placeholder feedback — requires reviews table
const PLACEHOLDER_FEEDBACK: FeedbackItem[] = [];

export function useReviewerDashboard(
  initialAssigned: AssignedReview[],
  initialCompleted: CompletedReview[],
  initialReputation?: ReputationScores | null,
  initialBreakdown?: ReputationBreakdownItem[] | null,
) {
  const [activeTab, setActiveTab] = useState<ReviewerTab>("assigned");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [expandedHistory, setExpandedHistory] = useState(false);

  const totalReviews = initialCompleted.length + initialAssigned.length;
  const activeCount = initialAssigned.length;
  const overdueCount = initialAssigned.filter((r) => r.status === "Late").length;

  const averageUsefulness = useMemo(
    () =>
      PLACEHOLDER_FEEDBACK.length > 0
        ? PLACEHOLDER_FEEDBACK.reduce((s, f) => s + f.usefulness, 0) / PLACEHOLDER_FEEDBACK.length
        : 0,
    [],
  );

  const tabs: ReviewerTabConfig[] = [
    { key: "assigned",  label: "Assigned Reviews",  count: initialAssigned.length },
    { key: "completed", label: "Completed Reviews",  count: initialCompleted.length },
    { key: "feedback",  label: "Feedback Received",  count: PLACEHOLDER_FEEDBACK.length },
  ];

  function getUrgencyStyle(daysLeft: number, status: string) {
    if (status === "Late")    return { color: "#d4645a", bg: "rgba(200,100,90,0.15)", border: "rgba(200,100,90,0.3)" };
    if (daysLeft <= 3)        return { color: "#d4a45a", bg: "rgba(200,160,90,0.15)", border: "rgba(200,160,90,0.3)" };
    return                           { color: "#8a8070", bg: "rgba(120,110,95,0.1)",  border: "rgba(120,110,95,0.2)" };
  }

  function getReviewForFeedback(reviewId: number) {
    return initialCompleted.find((r) => r.id === reviewId);
  }

  return {
    activeTab, setActiveTab,
    hoveredRow, setHoveredRow,
    expandedHistory, setExpandedHistory,
    totalReviews, activeCount, overdueCount,
    averageUsefulness,
    tabs,
    getUrgencyStyle,
    getReviewForFeedback,
    assignedReviews: initialAssigned,
    completedReviews: initialCompleted,
    feedbackItems: PLACEHOLDER_FEEDBACK,
    reputationHistory: PLACEHOLDER_REPUTATION_HISTORY,
    reputationBreakdown: initialBreakdown ?? PLACEHOLDER_REPUTATION_BREAKDOWN,
    reputationScores: initialReputation ?? PLACEHOLDER_REPUTATION_SCORES,
  };
}
