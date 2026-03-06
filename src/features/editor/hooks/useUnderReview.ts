"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelection } from "@/src/shared/hooks/useSelection";
import type {
  PaperCardData,
  PoolReviewer,
  ReviewerWithStatus,
  RebuttalInfo,
} from "@/src/features/editor/types";
import type { AuthorResponseStatusDb } from "@/src/shared/lib/db/schema";

interface UseUnderReviewOptions {
  initialPapers: PaperCardData[];
  initialReviewerPool: PoolReviewer[];
  reviewStatuses: Record<string, ReviewerWithStatus[]>;
  authorResponseStatuses: Record<string, AuthorResponseStatusDb | null>;
  rebuttalsBySubmission?: Record<string, RebuttalInfo>;
}

export function useUnderReview({
  initialPapers,
  initialReviewerPool,
  reviewStatuses,
  authorResponseStatuses,
  rebuttalsBySubmission,
}: UseUnderReviewOptions) {
  const router = useRouter();
  const [papers, setPapers] = useState(initialPapers);
  useEffect(() => { setPapers(initialPapers); }, [initialPapers]);

  const { selectedId, setSelectedId, selected } = useSelection(papers);
  const [editorComment, setEditorComment] = useState("");
  const [decision, setDecision] = useState("");
  const [additionalAssigned, setAdditionalAssigned] = useState<string[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [timelineDays] = useState(21);
  const [isReleasingDecision, setIsReleasingDecision] = useState(false);
  const [isResolvingRebuttal, setIsResolvingRebuttal] = useState(false);
  const [showDecisionConfirm, setShowDecisionConfirm] = useState(false);

  const currentReviewers = useMemo(
    () => (selectedId ? (reviewStatuses[selectedId] ?? []) : []),
    [selectedId, reviewStatuses],
  );

  const allReviewsComplete = useMemo(() => {
    return currentReviewers.length > 0 && currentReviewers.every(r => r.status === "complete");
  }, [currentReviewers]);

  const currentAuthorResponseStatus = selectedId ? (authorResponseStatuses[selectedId] ?? null) : null;
  const canMakeDecision = currentAuthorResponseStatus === "accepted" || currentAuthorResponseStatus === "rebuttal_requested";

  function releaseToAuthor() {
    if (!selectedId || !decision || !canMakeDecision) return;
    setShowDecisionConfirm(true);
  }

  async function confirmRelease(): Promise<boolean> {
    if (!selectedId || !decision) return false;
    setIsReleasingDecision(true);

    try {
      const response = await fetch(`/api/submissions/${selectedId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decision as "accept" | "reject" | "revise",
          comment: editorComment,
          allCriteriaMet: allReviewsComplete,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("[releaseToAuthor] API error:", err);
        return false;
      }

      // Success: remove paper from list, clear selection
      const releasedId = selectedId;
      setPapers((prev) => prev.filter((p) => p.id !== releasedId));
      setSelectedId(null);
      setEditorComment("");
      setDecision("");
      setShowDecisionConfirm(false);
      router.refresh();
      return true;
    } catch (err) {
      console.error("[releaseToAuthor] Unexpected error:", err);
      return false;
    } finally {
      setIsReleasingDecision(false);
    }
  }

  const currentRebuttal = useMemo(() => {
    if (!selectedId || !rebuttalsBySubmission) return null;
    return rebuttalsBySubmission[selectedId] ?? null;
  }, [selectedId, rebuttalsBySubmission]);

  async function resolveRebuttal(resolution: "upheld" | "rejected" | "partial", notes: string) {
    if (!currentRebuttal) return;
    setIsResolvingRebuttal(true);
    try {
      const res = await fetch(`/api/rebuttals/${currentRebuttal.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution, editorNotes: notes }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("[resolveRebuttal] API error:", err);
      }
    } catch (err) {
      console.error("[resolveRebuttal] Unexpected error:", err);
    } finally {
      setIsResolvingRebuttal(false);
    }
  }

  function assignReviewer(id: string) {
    setAdditionalAssigned((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  function removeReviewer(id: string) {
    setAdditionalAssigned((prev) => prev.filter((r) => r !== id));
  }

  return {
    papers,
    reviewerPool: initialReviewerPool,
    selectedId,
    setSelectedId,
    selected,
    currentReviewers,
    allReviewsComplete,
    currentAuthorResponseStatus,
    canMakeDecision,
    editorComment,
    setEditorComment,
    decision,
    setDecision,
    releaseToAuthor,
    confirmRelease,
    additionalAssigned,
    assignReviewer,
    removeReviewer,
    reviewerSearch,
    setReviewerSearch,
    timelineDays,
    isReleasingDecision,
    showDecisionConfirm,
    setShowDecisionConfirm,
    currentRebuttal,
    resolveRebuttal,
    isResolvingRebuttal,
  };
}
