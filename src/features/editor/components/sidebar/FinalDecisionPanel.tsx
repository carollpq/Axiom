"use client";

import type { AuthorResponseStatusDb } from "@/src/shared/lib/db/schema";
import { WaitingForReviewsPanel } from "./WaitingForReviewsPanel";
import { WaitingForAuthorPanel } from "./WaitingForAuthorPanel";
import { DecisionReadyPanel } from "./DecisionReadyPanel";

interface FinalDecisionPanelProps {
  comment: string;
  onCommentChange: (v: string) => void;
  decision: string;
  onDecisionChange: (v: string) => void;
  onRelease: () => void;
  allReviewsComplete?: boolean;
  authorResponseStatus: AuthorResponseStatusDb | null;
  canMakeDecision: boolean;
  isLoading?: boolean;
}

export function FinalDecisionPanel({
  comment,
  onCommentChange,
  decision,
  onDecisionChange,
  onRelease,
  allReviewsComplete,
  authorResponseStatus,
  canMakeDecision,
  isLoading = false,
}: FinalDecisionPanelProps) {
  if (!allReviewsComplete) return <WaitingForReviewsPanel />;
  if (!canMakeDecision)
    return <WaitingForAuthorPanel authorResponseStatus={authorResponseStatus} />;
  return (
    <DecisionReadyPanel
      comment={comment}
      onCommentChange={onCommentChange}
      decision={decision}
      onDecisionChange={onDecisionChange}
      onRelease={onRelease}
      isLoading={isLoading}
      authorResponseStatus={authorResponseStatus}
    />
  );
}
