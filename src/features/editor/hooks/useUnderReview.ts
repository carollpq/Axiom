"use client";

import { useState, useMemo } from "react";
import type {
  PaperCardData,
  PoolReviewer,
  ReviewerWithStatus,
} from "@/src/shared/types/editor-dashboard";

export function useUnderReview(
  initialPapers: PaperCardData[],
  initialReviewerPool: PoolReviewer[],
  reviewStatuses: Record<string, ReviewerWithStatus[]>,
) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorComment, setEditorComment] = useState("");
  const [decision, setDecision] = useState("");
  const [additionalAssigned, setAdditionalAssigned] = useState<string[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [timelineDays] = useState(12);

  const selected = useMemo(
    () => initialPapers.find((p) => p.id === selectedId) ?? null,
    [initialPapers, selectedId],
  );

  const currentReviewers = useMemo(
    () => (selectedId ? (reviewStatuses[selectedId] ?? []) : []),
    [selectedId, reviewStatuses],
  );

  function releaseToAuthor() {
    // TODO: API call
    console.log("Release decision:", { decision, editorComment, paperId: selectedId });
  }

  function assignReviewer(id: string) {
    setAdditionalAssigned((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeReviewer(id: string) {
    setAdditionalAssigned((prev) => prev.filter((r) => r !== id));
  }

  return {
    papers: initialPapers,
    reviewerPool: initialReviewerPool,
    selectedId,
    setSelectedId,
    selected,
    currentReviewers,
    editorComment,
    setEditorComment,
    decision,
    setDecision,
    releaseToAuthor,
    additionalAssigned,
    assignReviewer,
    removeReviewer,
    reviewerSearch,
    setReviewerSearch,
    timelineDays,
  };
}
