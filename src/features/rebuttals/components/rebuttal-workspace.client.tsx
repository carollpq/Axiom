'use client';

import { useRebuttal } from '@/src/features/rebuttals/hooks/useRebuttal';
import type { ReviewForRebuttal } from '@/src/features/rebuttals/types';
import type {
  RebuttalStatusDb,
  RebuttalResolutionDb,
} from '@/src/shared/lib/db/schema';
import { ReviewListPanel } from './review-list-panel.client';
import { ReviewDetailPanel } from './review-detail-panel';
import { ResponseFormPanel } from './response-form-panel.client';

interface RebuttalWorkspaceProps {
  rebuttalId: string;
  rebuttalStatus: RebuttalStatusDb;
  deadline: string;
  reviews: ReviewForRebuttal[];
  existingResponses?: {
    reviewId: string;
    position: string;
    justification: string;
  }[];
  resolution?: RebuttalResolutionDb | null;
  editorNotes?: string | null;
}

export function RebuttalWorkspace({
  rebuttalId,
  rebuttalStatus,
  deadline,
  reviews,
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
  const isPastDeadline = new Date(deadline) < new Date();
  const isReadOnly = rebuttalStatus !== 'open' || isPastDeadline || submitted;

  return (
    <div className="h-[calc(100vh-120px)] flex gap-0">
      <ReviewListPanel
        reviews={reviews}
        responses={responses}
        selectedReviewId={selectedReviewId}
        onSelect={selectReview}
        deadline={deadline}
        isPastDeadline={isPastDeadline}
      />

      <ReviewDetailPanel review={selectedReview} />

      <ResponseFormPanel
        rebuttalStatus={rebuttalStatus}
        resolution={resolution}
        editorNotes={editorNotes}
        submitted={submitted}
        selectedReviewId={selectedReviewId}
        isReadOnly={isReadOnly}
        isPastDeadline={isPastDeadline}
        responses={responses}
        isSubmitting={isSubmitting}
        error={error}
        onSetPosition={setPosition}
        onSetJustification={setJustification}
        onSubmit={submitRebuttal}
      />
    </div>
  );
}
