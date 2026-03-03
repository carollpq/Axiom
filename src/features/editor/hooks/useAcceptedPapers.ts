"use client";

import { useState, useMemo } from "react";
import { useSelection } from "@/src/shared/hooks/useSelection";
import type {
  PaperCardData,
  ReviewerWithStatus,
} from "@/src/features/editor/types";

export function useAcceptedPapers(
  initialPapers: PaperCardData[],
  reviewStatuses: Record<string, ReviewerWithStatus[]>,
) {
  const { selectedId, setSelectedId, selected } = useSelection(initialPapers);
  const [selectedIssue, setSelectedIssue] = useState("");

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
