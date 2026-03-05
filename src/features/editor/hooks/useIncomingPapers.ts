"use client";

import { useState, useEffect, useRef } from "react";
import { useSelection } from "@/src/shared/hooks/useSelection";
import type { PaperCardData, PoolReviewer } from "@/src/features/editor/types";

export function useIncomingPapers(
  initialPapers: PaperCardData[],
  initialReviewerPool: PoolReviewer[],
) {
  const { selectedId, setSelectedId, selected } = useSelection(initialPapers);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [deskRejectComment, setDeskRejectComment] = useState("");
  const [timelineDays] = useState(21);
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [isDeskRejecting, setIsDeskRejecting] = useState(false);

  // Auto-trigger "viewed by editor" when a paper is selected
  const viewedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!selectedId || viewedRef.current.has(selectedId)) return;
    viewedRef.current.add(selectedId);
    fetch(`/api/submissions/${selectedId}/view`, { method: "POST" }).catch(() => {});
  }, [selectedId]);

  function assignReviewer(id: string) {
    setAssignedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeReviewer(id: string) {
    setAssignedIds((prev) => prev.filter((r) => r !== id));
  }

  async function sendInvites() {
    if (!selectedId || assignedIds.length === 0) return;
    setIsSendingInvites(true);

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

  async function submitDeskReject() {
    if (!selectedId) return;
    setIsDeskRejecting(true);

    try {
      const response = await fetch(`/api/submissions/${selectedId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: "reject",
          comment: deskRejectComment,
          allCriteriaMet: false,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("[deskReject] API error:", err);
      } else {
        setDeskRejectComment("");
      }
    } catch (err) {
      console.error("[deskReject] Unexpected error:", err);
    } finally {
      setIsDeskRejecting(false);
    }
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
    isDeskRejecting,
  };
}
