'use client';

import {
  useReducer,
  useMemo,
  useCallback,
  useState,
  useTransition,
} from 'react';
import { toast } from 'sonner';
import type {
  CriterionRating,
  GeneralComments,
  Recommendation,
  SubmissionResult,
} from '@/src/features/reviewer/types/workspace';
import { canonicalJson, sha256 } from '@/src/shared/lib/hashing';
import { formatDate, truncate } from '@/src/shared/lib/format';
import { submitReviewAction } from '@/src/features/reviews/actions';
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
} from '@/src/features/reviewer/lib/workspace';
import type { ReviewAssignmentLike } from '@/src/features/reviewer/lib/workspace';

/** Manages the full review form: per-criterion evaluations, comments, recommendation, and submission. */
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

  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);

  const completedCount = selectCompletedCount(state);
  const allCriteriaMet = selectAllCriteriaMet(state);
  const canSubmit = selectCanSubmit(state) && !isPending;

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

  const submitReview = () => {
    if (!canSubmit) return;

    let met = 0,
      partial = 0,
      notMet = 0;
    for (const e of Object.values(state.evaluations)) {
      if (e.rating === 'Yes') met++;
      else if (e.rating === 'Partially') partial++;
      else if (e.rating === 'No') notMet++;
    }

    const reviewPayload = {
      evaluations: state.evaluations,
      recommendation: state.recommendation,
      strengths: state.generalComments.strengths,
      weaknesses: state.generalComments.weaknesses,
      questionsForAuthors: state.generalComments.questionsForAuthors,
    };
    const confidentialEditorComments =
      state.generalComments.confidentialEditorComments;

    startTransition(async () => {
      const reviewHash = await sha256(canonicalJson(reviewPayload));

      try {
        await submitReviewAction(assignment.id, {
          criteriaEvaluations: reviewPayload.evaluations,
          strengths: reviewPayload.strengths,
          weaknesses: reviewPayload.weaknesses,
          questionsForAuthors: reviewPayload.questionsForAuthors,
          confidentialEditorComments,
          recommendation: reviewPayload.recommendation as string,
          reviewHash,
        });

        toast.success('Review submitted successfully');
        setIsSubmitted(true);
        setSubmissionResult({
          txHash: 'pending',
          timestamp: formatDate(new Date().toISOString(), 'datetime'),
          paperHash: truncate(paper.provenance[0]?.hash ?? '', 16),
          reviewHash: truncate(reviewHash, 16),
          criteriaSummary: { met, partial, notMet },
        });
      } catch (err) {
        console.error('[Review submit] Unexpected error:', err);
        toast.error('Failed to submit review');
      }
    });
  };

  return {
    paper,
    criteria,
    evaluations: state.evaluations,
    generalComments: state.generalComments,
    recommendation: state.recommendation,
    isDraft: state.isDraft,
    isSubmitted,
    submissionResult,
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
    isSubmitting: isPending,
  };
}
