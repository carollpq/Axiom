"use client";

import { useState, useMemo } from "react";
import type {
  PaperCardData,
  ReviewerWithStatus,
} from "@/src/shared/types/editor-dashboard";

export function useAcceptedPapers(
  initialPapers: PaperCardData[],
  reviewStatuses: Record<string, ReviewerWithStatus[]>,
) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState("");

  const selected = useMemo(
    () => initialPapers.find((p) => p.id === selectedId) ?? null,
    [initialPapers, selectedId],
  );

  const currentReviewers = useMemo(
    () => (selectedId ? (reviewStatuses[selectedId] ?? []) : []),
    [selectedId, reviewStatuses],
  );

  return {
    papers: initialPapers,
    selectedId,
    setSelectedId,
    selected,
    currentReviewers,
    selectedIssue,
    setSelectedIssue,
  };
}
