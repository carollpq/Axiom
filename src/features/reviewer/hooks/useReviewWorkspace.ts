'use client';

import {
  useReducer,
  useMemo,
  useCallback,
  useRef,
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
import { getErrorMessage } from '@/src/shared/lib/errors';
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

const RECOMMENDATION_MAP: Record<string, string> = {
  Accept: 'accept',
  'Minor Revisions': 'minor_revision',
  'Major Revisions': 'major_revision',
  Reject: 'reject',
};

/** Manages the full review form: per-criterion evaluations, comments, recommendation, and submission. */
export function useReviewWorkspace(assignment: ReviewAssignmentLike) {
  const paper = useMemo(() => mapAssignmentToPaper(assignment), [assignment]);

  const criteria = useMemo(
    () => mapAssignmentToCriteria(assignment),
    [assignment],
  );

  const [state, dispatch] = useReducer(
    reviewWorkspaceReducer,
    { criteria, assignmentId: assignment.id },
    ({ criteria, assignmentId }) => createInitialState(criteria, assignmentId),
  );

  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

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

  const stateRef = useRef(state);
  stateRef.current = state;

  const saveDraft = useCallback(() => {
    dispatch({ type: 'SAVE_DRAFT' });
    try {
      const s = stateRef.current;
      const draft = {
        evaluations: s.evaluations,
        generalComments: s.generalComments,
        recommendation: s.recommendation,
      };
      localStorage.setItem(
        `review_draft_${assignment.id}`,
        JSON.stringify(draft),
      );
    } catch {
      // localStorage full or unavailable — silent fail
    }
    toast.success('Draft saved');
  }, [assignment.id]);

  const submitReview = () => {
    if (!canSubmit) return;
    setSubmissionError(null);

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
        const result = await submitReviewAction(assignment.id, {
          criteriaEvaluations: reviewPayload.evaluations,
          strengths: reviewPayload.strengths,
          weaknesses: reviewPayload.weaknesses,
          questionsForAuthors: reviewPayload.questionsForAuthors,
          confidentialEditorComments,
          recommendation:
            RECOMMENDATION_MAP[reviewPayload.recommendation as string] ??
            (reviewPayload.recommendation as string),
          reviewHash,
        });

        localStorage.removeItem(`review_draft_${assignment.id}`);
        toast.success('Review submitted successfully');
        setIsSubmitted(true);
        setSubmissionResult({
          txHash: result.hederaTxId,
          timestamp: formatDate(new Date().toISOString(), 'datetime'),
          paperHash: truncate(paper.provenance[0]?.hash ?? '', 16),
          reviewHash: truncate(reviewHash, 16),
          criteriaSummary: { met, partial, notMet },
        });
      } catch (err) {
        console.error('[Review submit] Unexpected error:', err);
        setSubmissionError(getErrorMessage(err, 'Failed to submit review'));
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
    hasUnsavedChanges: state.hasUnsavedChanges,
    isSubmitted,
    submissionResult,
    submissionError,
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
