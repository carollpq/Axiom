"use client";

import { useRebuttal } from "@/src/features/rebuttals/hooks/useRebuttal";
import { ReviewListPanel } from "./ReviewListPanel";
import { ReviewDetailPanel } from "./ReviewDetailPanel";
import { ResponseFormPanel } from "./ResponseFormPanel";

interface ReviewForRebuttal {
  id: string;
  anonymousLabel: string;
  criteriaEvaluations: string | null;
  strengths: string | null;
  weaknesses: string | null;
  questionsForAuthors: string | null;
  recommendation: string | null;
}

interface RebuttalWorkspaceProps {
  rebuttalId: string;
  rebuttalStatus: string;
  deadline: string;
  reviews: ReviewForRebuttal[];
  existingResponses?: {
    reviewId: string;
    position: string;
    justification: string;
  }[];
  resolution?: string | null;
  editorNotes?: string | null;
}

export function RebuttalWorkspace({
  rebuttalId,
  rebuttalStatus,
  deadline,
  reviews,
  existingResponses,
  resolution,
  editorNotes,
}: RebuttalWorkspaceProps) {
  const {
    responses,
    selectedReviewId,
    isSubmitting,
    submitted,
    error,
    selectReview,
    setPosition,
    setJustification,
    submitRebuttal,
  } = useRebuttal(
    rebuttalId,
    reviews.map((r) => r.id),
  );

  const selectedReview = reviews.find((r) => r.id === selectedReviewId);
  const deadlineDate = new Date(deadline);
  const isPastDeadline = deadlineDate < new Date();
  const isReadOnly = rebuttalStatus !== "open" || isPastDeadline || submitted;

  return (
    <div className="h-[calc(100vh-120px)] flex gap-0">
      <ReviewListPanel
        reviews={reviews}
        responses={responses}
        selectedReviewId={selectedReviewId}
        onSelect={selectReview}
        deadline={deadline}
      />

      <ReviewDetailPanel review={selectedReview} />

      <ResponseFormPanel
        rebuttalStatus={rebuttalStatus}
        resolution={resolution}
        editorNotes={editorNotes}
        submitted={submitted}
        selectedReviewId={selectedReviewId}
        isReadOnly={isReadOnly}
        responses={responses}
        isSubmitting={isSubmitting}
        error={error}
        existingResponses={existingResponses}
        onSetPosition={setPosition}
        onSetJustification={setJustification}
        onSubmit={submitRebuttal}
      />
    </div>
  );
}
