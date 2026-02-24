"use client";

import { useState, useMemo } from "react";
import type {
  StageFilter,
  DetailTab,
  ViewMode,
  JournalStatCardData,
  PipelineCounts,
  SubmissionStage,
} from "@/src/shared/types/journal-dashboard";
import {
  mockSubmissions,
  pipelineStages,
  stageColors,
  mockReviewerPool,
  journalStats,
} from "@/lib/mock-data/journal-dashboard";

export function useJournalDashboard() {
  const [filter, setFilter] = useState<StageFilter>("All");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("info");
  const [searchReviewer, setSearchReviewer] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const filtered = useMemo(
    () => filter === "All" ? mockSubmissions : mockSubmissions.filter(s => s.stage === filter),
    [filter],
  );

  const selected = useMemo(
    () => mockSubmissions.find(s => s.id === selectedSubmission) ?? null,
    [selectedSubmission],
  );

  const pipelineCounts = useMemo(() => {
    const counts = {} as PipelineCounts;
    for (const st of pipelineStages) {
      counts[st] = mockSubmissions.filter(s => s.stage === st).length;
    }
    return counts;
  }, []);

  const filteredReviewers = useMemo(
    () => mockReviewerPool.filter(r =>
      r.name.toLowerCase().includes(searchReviewer.toLowerCase()) ||
      r.field.toLowerCase().includes(searchReviewer.toLowerCase()),
    ),
    [searchReviewer],
  );

  const activeReviewCount = useMemo(
    () => mockSubmissions.filter(s => s.stage === "Under Review" || s.stage === "Reviewers Assigned").length,
    [],
  );

  const stats: JournalStatCardData[] = useMemo(() => [
    { label: "Total Submissions", value: mockSubmissions.length },
    { label: "Active Reviews", value: activeReviewCount },
    { label: "Avg Review Time", value: journalStats.avgReviewDays + "d", sub: "Target: 45 days" },
    { label: "Acceptance Rate", value: journalStats.acceptRate + "%" },
    { label: "Journal Reputation", value: journalStats.journalScore.toFixed(1), sub: "/ 5.0" },
  ], [activeReviewCount]);

  function selectSubmission(id: number) {
    setSelectedSubmission(prev => prev === id ? null : id);
    setDetailTab("info");
  }

  function clearSelection() {
    setSelectedSubmission(null);
  }

  function toggleFilter(stage: SubmissionStage) {
    setFilter(prev => prev === stage ? "All" : stage);
  }

  return {
    filter,
    setFilter,
    hoveredRow,
    setHoveredRow,
    selectedSubmission,
    detailTab,
    setDetailTab,
    searchReviewer,
    setSearchReviewer,
    viewMode,
    setViewMode,
    filtered,
    selected,
    pipelineCounts,
    filteredReviewers,
    activeReviewCount,
    stats,
    selectSubmission,
    clearSelection,
    toggleFilter,
    stageColors,
    submissions: mockSubmissions,
  };
}
