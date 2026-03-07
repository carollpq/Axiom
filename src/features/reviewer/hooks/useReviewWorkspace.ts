'use client';

import { useReducer, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  CriterionRating,
  GeneralComments,
  Recommendation,
} from '@/src/features/reviewer/types';
import { canonicalJson, hashString } from '@/src/shared/lib/hashing';
import { formatTimestampUtc } from '@/src/shared/lib/format';
import {
  reviewWorkspaceReducer,
  createInitialState,
  selectCompletedCount,
  selectAllCriteriaMet,
  selectCanSubmit,
} from '@/src/features/reviewer/reducers/review-workspace';
import {
  mapAssignmentToPaper,
  mapAssignmentToCriteria,
} from '@/src/features/reviewer/mappers/workspace';
import type { ReviewAssignmentLike } from '@/src/features/reviewer/mappers/workspace';

export function useReviewWorkspace(assignment: ReviewAssignmentLike) {
  const paper = useMemo(() => mapAssignmentToPaper(assignment), [assignment]);

  const criteria = useMemo(
    () => mapAssignmentToCriteria(assignment),
    [assignment],
  );

  const [state, dispatch] = useReducer(
    reviewWorkspaceReducer,
    criteria,
    createInitialState,
  );

  const completedCount = selectCompletedCount(state);
  const allCriteriaMet = selectAllCriteriaMet(state);
  const canSubmit = selectCanSubmit(state);

  const setCriterionRating = useCallback(
    (id: number, rating: CriterionRating) => {
      dispatch({ type: 'SET_CRITERION_RATING', id, rating });
    },
    [],
  );

  const setCriterionComment = useCallback((id: number, comment: string) => {
    dispatch({ type: 'SET_CRITERION_COMMENT', id, comment });
  }, []);

  const setGeneralComment = useCallback(
    (field: keyof GeneralComments, value: string) => {
      dispatch({ type: 'SET_GENERAL_COMMENT', field, value });
    },
    [],
  );

  const saveDraft = useCallback(() => {
    dispatch({ type: 'SAVE_DRAFT' });
    toast.success('Draft saved');
  }, []);

  const submitReview = useCallback(async () => {
    if (!canSubmit) return;
    dispatch({ type: 'SUBMIT_START' });

    let met = 0,
      partial = 0,
      notMet = 0;
    for (const e of Object.values(state.evaluations)) {
      if (e.rating === 'Yes') met++;
      else if (e.rating === 'Partially') partial++;
      else if (e.rating === 'No') notMet++;
    }

    // Compute review hash (excluding confidentialEditorComments — those never leave the server)
    const reviewPayload = {
      evaluations: state.evaluations,
      recommendation: state.recommendation,
      strengths: state.generalComments.strengths,
      weaknesses: state.generalComments.weaknesses,
      questionsForAuthors: state.generalComments.questionsForAuthors,
    };
    const reviewHash = await hashString(canonicalJson(reviewPayload));

    try {
      const response = await fetch(`/api/reviews/${assignment.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criteriaEvaluations: state.evaluations,
          strengths: state.generalComments.strengths,
          weaknesses: state.generalComments.weaknesses,
          questionsForAuthors: state.generalComments.questionsForAuthors,
          confidentialEditorComments:
            state.generalComments.confidentialEditorComments,
          recommendation: state.recommendation,
          reviewHash,
        }),
      });

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        console.error('[Review submit] API error:', err);
        toast.error(err.error ?? 'Failed to submit review');
        dispatch({ type: 'SUBMIT_ERROR' });
        return;
      }

      const result = (await response.json()) as {
        reviewId: string;
        hederaTxId?: string;
        hederaTimestamp?: string;
      };

      toast.success('Review submitted successfully');

      dispatch({
        type: 'SUBMIT_SUCCESS',
        submissionResult: {
          txHash: result.hederaTxId ?? 'pending',
          timestamp: formatTimestampUtc(
            result.hederaTimestamp ?? new Date().toISOString(),
          ),
          paperHash: paper.provenance[0]?.hash.slice(0, 16) + '...',
          reviewHash: reviewHash.slice(0, 16) + '...',
          criteriaSummary: { met, partial, notMet },
        },
      });
    } catch (err) {
      console.error('[Review submit] Unexpected error:', err);
      toast.error('Failed to submit review');
      dispatch({ type: 'SUBMIT_ERROR' });
    }
  }, [
    assignment,
    canSubmit,
    state.evaluations,
    state.recommendation,
    state.generalComments,
    paper.provenance,
  ]);

  return {
    paper,
    criteria,
    evaluations: state.evaluations,
    generalComments: state.generalComments,
    recommendation: state.recommendation,
    isDraft: state.isDraft,
    isSubmitted: state.isSubmitted,
    submissionResult: state.submissionResult,
    criteriaCollapsed: state.criteriaCollapsed,
    setCriteriaCollapsed: (criteriaCollapsed: boolean) =>
      dispatch({ type: 'SET_CRITERIA_COLLAPSED', criteriaCollapsed }),
    completedCount,
    allCriteriaMet,
    canSubmit,
    setCriterionRating,
    setCriterionComment,
    setGeneralComment,
    setRecommendation: (recommendation: Recommendation | null) =>
      dispatch({ type: 'SET_RECOMMENDATION', recommendation }),
    saveDraft,
    submitReview,
    isSubmitting: state.isSubmitting,
  };
}
