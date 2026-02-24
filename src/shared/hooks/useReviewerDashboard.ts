"use client";

import { useState, useMemo } from "react";
import type { ReviewerTab, ReviewerTabConfig } from "@/src/shared/types/reviewer-dashboard";
import {
  mockAssignedReviews,
  mockCompletedReviews,
  mockFeedbackItems,
  mockReputationHistory,
  mockReputationBreakdown,
  mockReputationScores,
} from "@/src/shared/lib/mock-data/reviewer-dashboard";

export function useReviewerDashboard() {
  const [activeTab, setActiveTab] = useState<ReviewerTab>("assigned");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [expandedHistory, setExpandedHistory] = useState(false);

  const totalReviews = mockCompletedReviews.length + mockAssignedReviews.length;
  const activeCount = mockAssignedReviews.length;
  const overdueCount = mockAssignedReviews.filter((r) => r.status === "Late").length;

  const averageUsefulness = useMemo(
    () => mockFeedbackItems.reduce((s, f) => s + f.usefulness, 0) / mockFeedbackItems.length,
    [],
  );

  const tabs: ReviewerTabConfig[] = [
    { key: "assigned", label: "Assigned Reviews", count: mockAssignedReviews.length },
    { key: "completed", label: "Completed Reviews", count: mockCompletedReviews.length },
    { key: "feedback", label: "Feedback Received", count: mockFeedbackItems.length },
  ];

  function getUrgencyStyle(daysLeft: number, status: string) {
    if (status === "Late") return { color: "#d4645a", bg: "rgba(200,100,90,0.15)", border: "rgba(200,100,90,0.3)" };
    if (daysLeft <= 3) return { color: "#d4a45a", bg: "rgba(200,160,90,0.15)", border: "rgba(200,160,90,0.3)" };
    return { color: "#8a8070", bg: "rgba(120,110,95,0.1)", border: "rgba(120,110,95,0.2)" };
  }

  function getReviewForFeedback(reviewId: number) {
    return mockCompletedReviews.find((r) => r.id === reviewId);
  }

  return {
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
    assignedReviews: mockAssignedReviews,
    completedReviews: mockCompletedReviews,
    feedbackItems: mockFeedbackItems,
    reputationHistory: mockReputationHistory,
    reputationBreakdown: mockReputationBreakdown,
    reputationScores: mockReputationScores,
  };
}
