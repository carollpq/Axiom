'use client';

import { useReducer, useState, useTransition } from 'react';
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
}

type Action =
  | { type: 'SELECT_REVIEW'; reviewId: string }
  | { type: 'SET_POSITION'; reviewId: string; position: RebuttalPositionDb }
  | { type: 'SET_JUSTIFICATION'; reviewId: string; justification: string };

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
  });

  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRebuttal = () => {
    const responses = Object.values(state.responses).filter((r) =>
      r.justification.trim(),
    );
    if (responses.length === 0) {
      setError('Please provide at least one response');
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await respondToRebuttalAction(rebuttalId, { responses });
        setSubmitted(true);
        toast.success('Rebuttal submitted');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Submission failed';
        setError(message);
        toast.error(message);
      }
    });
  };

  return {
    ...state,
    isSubmitting: isPending,
    submitted,
    error,
    selectReview: (id: string) =>
      dispatch({ type: 'SELECT_REVIEW', reviewId: id }),
    setPosition: (reviewId: string, position: RebuttalPositionDb) =>
      dispatch({ type: 'SET_POSITION', reviewId, position }),
    setJustification: (reviewId: string, justification: string) =>
      dispatch({ type: 'SET_JUSTIFICATION', reviewId, justification }),
    submitRebuttal,
  };
}
