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
  const [timelineDays] = useState(21);
  const [isSendingInvites, setIsSendingInvites] = useState(false);

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

  async function sendInvites() {
    if (!selectedId || assignedIds.length === 0) return;
    setIsSendingInvites(true);

    // Map reviewer pool IDs to wallet addresses
    const reviewerWallets = assignedIds.map(id => {
      const reviewer = initialReviewerPool.find(r => r.id === id);
      return reviewer?.wallet ?? id;
    });

    try {
      const response = await fetch(`/api/submissions/${selectedId}/assign-reviewer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerWallets, deadlineDays: timelineDays }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("[sendInvites] API error:", err);
      } else {
        setAssignedIds([]);
      }
    } catch (err) {
      console.error("[sendInvites] Unexpected error:", err);
    } finally {
      setIsSendingInvites(false);
    }
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
    isSendingInvites,
  };
}
