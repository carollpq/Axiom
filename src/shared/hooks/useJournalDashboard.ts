"use client";

import { useState, useMemo } from "react";
import type {
  StageFilter,
  DetailTab,
  ViewMode,
  JournalStatCardData,
  PipelineCounts,
  SubmissionStage,
  JournalSubmission,
  PoolReviewer,
} from "@/src/shared/types/journal-dashboard";
import { pipelineStages, stageColors } from "@/src/features/journal/constants";

const JOURNAL_STATS = { avgReviewDays: 38, acceptRate: 62, journalScore: 4.3 };

export function useJournalDashboard(
  initialSubmissions: JournalSubmission[],
  initialReviewerPool: PoolReviewer[],
) {
  const [filter, setFilter] = useState<StageFilter>("All");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<number | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("info");
  const [searchReviewer, setSearchReviewer] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const filtered = useMemo(
    () => filter === "All" ? initialSubmissions : initialSubmissions.filter(s => s.stage === filter),
    [filter, initialSubmissions],
  );

  const selected = useMemo(
    () => initialSubmissions.find(s => s.id === selectedSubmission) ?? null,
    [selectedSubmission, initialSubmissions],
  );

  const pipelineCounts = useMemo(() => {
    const counts = {} as PipelineCounts;
    for (const st of pipelineStages) {
      counts[st] = initialSubmissions.filter(s => s.stage === st).length;
    }
    return counts;
  }, [initialSubmissions]);

  const filteredReviewers = useMemo(
    () => initialReviewerPool.filter(r =>
      r.name.toLowerCase().includes(searchReviewer.toLowerCase()) ||
      r.field.toLowerCase().includes(searchReviewer.toLowerCase()),
    ),
    [searchReviewer, initialReviewerPool],
  );

  const activeReviewCount = useMemo(
    () => initialSubmissions.filter(s => s.stage === "Under Review" || s.stage === "Reviewers Assigned").length,
    [initialSubmissions],
  );

  const stats: JournalStatCardData[] = useMemo(() => [
    { label: "Total Submissions", value: initialSubmissions.length },
    { label: "Active Reviews",    value: activeReviewCount },
    { label: "Avg Review Time",   value: JOURNAL_STATS.avgReviewDays + "d", sub: "Target: 45 days" },
    { label: "Acceptance Rate",   value: JOURNAL_STATS.acceptRate + "%" },
    { label: "Journal Reputation",value: JOURNAL_STATS.journalScore.toFixed(1), sub: "/ 5.0" },
  ], [initialSubmissions.length, activeReviewCount]);

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
    filter, setFilter,
    hoveredRow, setHoveredRow,
    selectedSubmission,
    detailTab, setDetailTab,
    searchReviewer, setSearchReviewer,
    viewMode, setViewMode,
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
    submissions: initialSubmissions,
  };
}
