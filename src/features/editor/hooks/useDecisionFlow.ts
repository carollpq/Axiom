'use client';

import { useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { makeDecisionAction } from '@/src/features/submissions/actions';
import type { ReviewerWithStatus } from '@/src/features/editor/types';
import type { AuthorResponseStatusDb } from '@/src/shared/lib/db/schema';

interface UseDecisionFlowOptions {
  selectedId: string | null;
  reviewStatuses: Record<string, ReviewerWithStatus[]>;
  authorResponseStatuses: Record<string, AuthorResponseStatusDb | null>;
  onDecisionReleased: (submissionId: string) => void;
}

/** Manages editorial decision: gated by all reviews complete + author response received. */
export function useDecisionFlow({
  selectedId,
  reviewStatuses,
  authorResponseStatuses,
  onDecisionReleased,
}: UseDecisionFlowOptions) {
  const router = useRouter();
  const onReleasedRef = useRef(onDecisionReleased);
  onReleasedRef.current = onDecisionReleased;
  const [editorComment, setEditorComment] = useState('');
  const [decision, setDecision] = useState('');
  const [reviewerRatings, setReviewerRatings] = useState<
    Record<string, number>
  >({});
  const [isReleasingDecision, setIsReleasingDecision] = useState(false);
  const [showDecisionConfirm, setShowDecisionConfirm] = useState(false);

  const currentReviewers = useMemo(
    () => (selectedId ? (reviewStatuses[selectedId] ?? []) : []),
    [selectedId, reviewStatuses],
  );

  const allReviewsComplete = useMemo(() => {
    return (
      currentReviewers.length > 0 &&
      currentReviewers.every((r) => r.status === 'complete')
    );
  }, [currentReviewers]);

  const currentAuthorResponseStatus = selectedId
    ? (authorResponseStatuses[selectedId] ?? null)
    : null;

  const canMakeDecision =
    currentAuthorResponseStatus === 'accepted' ||
    currentAuthorResponseStatus === 'rebuttal_requested';

  function releaseToAuthor() {
    if (!selectedId || !decision || !canMakeDecision) return;
    setShowDecisionConfirm(true);
  }

  async function confirmRelease(): Promise<boolean> {
    if (!selectedId || !decision) return false;
    setIsReleasingDecision(true);

    try {
      const ratingsToSend =
        Object.keys(reviewerRatings).length > 0 ? reviewerRatings : undefined;

      await makeDecisionAction(selectedId, {
        decision: decision as 'accept' | 'reject' | 'revise',
        comment: editorComment,
        reviewerRatings: ratingsToSend,
      });

      onReleasedRef.current(selectedId);
      setEditorComment('');
      setDecision('');
      setReviewerRatings({});
      setShowDecisionConfirm(false);
      router.refresh();
      return true;
    } catch (err) {
      console.error('[releaseToAuthor] Unexpected error:', err);
      return false;
    } finally {
      setIsReleasingDecision(false);
    }
  }

  return {
    currentReviewers,
    allReviewsComplete,
    currentAuthorResponseStatus,
    canMakeDecision,
    editorComment,
    setEditorComment,
    decision,
    setDecision,
    reviewerRatings,
    setReviewerRatings,
    releaseToAuthor,
    confirmRelease,
    isReleasingDecision,
    showDecisionConfirm,
    setShowDecisionConfirm,
  };
}
