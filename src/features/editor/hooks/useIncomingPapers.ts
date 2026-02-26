"use client";

import { useState, useMemo } from "react";
import type { PaperCardData, PoolReviewer } from "@/src/shared/types/editor-dashboard";

export function useIncomingPapers(
  initialPapers: PaperCardData[],
  initialReviewerPool: PoolReviewer[],
) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [deskRejectComment, setDeskRejectComment] = useState("");
  const [timelineDays] = useState(12);

  const selected = useMemo(
    () => initialPapers.find((p) => p.id === selectedId) ?? null,
    [initialPapers, selectedId],
  );

  function assignReviewer(id: string) {
    setAssignedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeReviewer(id: string) {
    setAssignedIds((prev) => prev.filter((r) => r !== id));
  }

  function sendInvites() {
    // TODO: API call
    console.log("Sending invites to:", assignedIds);
  }

  function submitDeskReject() {
    // TODO: API call
    console.log("Desk reject:", deskRejectComment);
    setDeskRejectComment("");
  }

  return {
    papers: initialPapers,
    reviewerPool: initialReviewerPool,
    selectedId,
    setSelectedId,
    selected,
    assignedIds,
    assignReviewer,
    removeReviewer,
    reviewerSearch,
    setReviewerSearch,
    deskRejectComment,
    setDeskRejectComment,
    timelineDays,
    sendInvites,
    submitDeskReject,
  };
}
