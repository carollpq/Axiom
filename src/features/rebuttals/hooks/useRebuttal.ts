'use client';

import { useReducer, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import type { RebuttalPositionDb } from '@/src/shared/lib/db/schema';
import { respondToRebuttalAction } from '@/src/features/rebuttals/actions';

interface ResponseDraft {
  reviewId: string;
  position: RebuttalPositionDb;
  justification: string;
}

interface State {
  responses: Record<string, ResponseDraft>;
  selectedReviewId: string | null;
  isSubmitting: boolean;
  submitted: boolean;
  error: string | null;
}

type Action =
  | { type: 'SELECT_REVIEW'; reviewId: string }
  | { type: 'SET_POSITION'; reviewId: string; position: RebuttalPositionDb }
  | { type: 'SET_JUSTIFICATION'; reviewId: string; justification: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_REVIEW':
      return { ...state, selectedReviewId: action.reviewId };
    case 'SET_POSITION':
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.reviewId]: {
            ...(state.responses[action.reviewId] ?? {
              reviewId: action.reviewId,
              position: 'agree',
              justification: '',
            }),
            position: action.position,
          },
        },
      };
    case 'SET_JUSTIFICATION':
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.reviewId]: {
            ...(state.responses[action.reviewId] ?? {
              reviewId: action.reviewId,
              position: 'agree',
              justification: '',
            }),
            justification: action.justification,
          },
        },
      };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, submitted: true };
    case 'SUBMIT_ERROR':
      return { ...state, isSubmitting: false, error: action.error };
  }
}

export function useRebuttal(rebuttalId: string, reviewIds: string[]) {
  const [state, dispatch] = useReducer(reducer, {
    responses: Object.fromEntries(
      reviewIds.map((id) => [
        id,
        { reviewId: id, position: 'agree' as const, justification: '' },
      ]),
    ),
    selectedReviewId: reviewIds[0] ?? null,
    isSubmitting: false,
    submitted: false,
    error: null,
  });

  const responsesRef = useRef(state.responses);
  useEffect(() => {
    responsesRef.current = state.responses;
  }, [state.responses]);

  const submitRebuttal = useCallback(async () => {
    const responses = Object.values(responsesRef.current).filter((r) =>
      r.justification.trim(),
    );
    if (responses.length === 0) {
      dispatch({
        type: 'SUBMIT_ERROR',
        error: 'Please provide at least one response',
      });
      return;
    }

    dispatch({ type: 'SUBMIT_START' });

    try {
      await respondToRebuttalAction(rebuttalId, { responses });

      dispatch({ type: 'SUBMIT_SUCCESS' });
      toast.success('Rebuttal submitted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submission failed';
      dispatch({ type: 'SUBMIT_ERROR', error: message });
      toast.error(message);
    }
  }, [rebuttalId]);

  return {
    ...state,
    selectReview: (id: string) =>
      dispatch({ type: 'SELECT_REVIEW', reviewId: id }),
    setPosition: (reviewId: string, position: RebuttalPositionDb) =>
      dispatch({ type: 'SET_POSITION', reviewId, position }),
    setJustification: (reviewId: string, justification: string) =>
      dispatch({ type: 'SET_JUSTIFICATION', reviewId, justification }),
    submitRebuttal,
  };
}
