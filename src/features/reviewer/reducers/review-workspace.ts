import type {
  CriterionRating,
  CriterionEvaluation,
  GeneralComments,
  Recommendation,
  ReviewCriterion,
} from '@/src/features/reviewer/types/workspace';

export interface ReviewWorkspaceState {
  evaluations: Record<number, CriterionEvaluation>;
  generalComments: GeneralComments;
  recommendation: Recommendation | null;
  isDraft: boolean;
  hasUnsavedChanges: boolean;
  criteriaCollapsed: boolean;
}

export function createInitialState(
  criteria: ReviewCriterion[],
  assignmentId?: string,
): ReviewWorkspaceState {
  const evaluations: Record<number, CriterionEvaluation> = {};
  for (const criterion of criteria) {
    evaluations[criterion.id] = {
      criterionId: criterion.id,
      rating: null,
      comment: '',
    };
  }

  // Hydrate from localStorage if a draft was previously saved
  if (assignmentId && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`review_draft_${assignmentId}`);
      if (saved) {
        const draft = JSON.parse(saved) as {
          evaluations?: Record<number, CriterionEvaluation>;
          generalComments?: GeneralComments;
          recommendation?: Recommendation | null;
        };
        return {
          evaluations: draft.evaluations ?? evaluations,
          generalComments: draft.generalComments ?? {
            strengths: '',
            weaknesses: '',
            questionsForAuthors: '',
            confidentialEditorComments: '',
          },
          recommendation: draft.recommendation ?? null,
          isDraft: true,
          hasUnsavedChanges: false,
          criteriaCollapsed: false,
        };
      }
    } catch {
      // Ignore corrupt localStorage data
    }
  }

  return {
    evaluations,
    generalComments: {
      strengths: '',
      weaknesses: '',
      questionsForAuthors: '',
      confidentialEditorComments: '',
    },
    recommendation: null,
    isDraft: false,
    hasUnsavedChanges: false,
    criteriaCollapsed: false,
  };
}

export type ReviewWorkspaceAction =
  | { type: 'SET_CRITERION_RATING'; id: number; rating: CriterionRating }
  | { type: 'SET_CRITERION_COMMENT'; id: number; comment: string }
  | { type: 'SET_GENERAL_COMMENT'; field: keyof GeneralComments; value: string }
  | { type: 'SET_RECOMMENDATION'; recommendation: Recommendation | null }
  | { type: 'SAVE_DRAFT' }
  | { type: 'SET_CRITERIA_COLLAPSED'; criteriaCollapsed: boolean };

export function reviewWorkspaceReducer(
  state: ReviewWorkspaceState,
  action: ReviewWorkspaceAction,
): ReviewWorkspaceState {
  switch (action.type) {
    case 'SET_CRITERION_RATING':
      return {
        ...state,
        hasUnsavedChanges: true,
        evaluations: {
          ...state.evaluations,
          [action.id]: {
            ...state.evaluations[action.id],
            rating: action.rating,
          },
        },
      };

    case 'SET_CRITERION_COMMENT':
      return {
        ...state,
        hasUnsavedChanges: true,
        evaluations: {
          ...state.evaluations,
          [action.id]: {
            ...state.evaluations[action.id],
            comment: action.comment,
          },
        },
      };

    case 'SET_GENERAL_COMMENT':
      return {
        ...state,
        hasUnsavedChanges: true,
        generalComments: {
          ...state.generalComments,
          [action.field]: action.value,
        },
      };

    case 'SET_RECOMMENDATION':
      return {
        ...state,
        hasUnsavedChanges: true,
        recommendation: action.recommendation,
      };

    case 'SAVE_DRAFT':
      return { ...state, isDraft: true, hasUnsavedChanges: false };

    case 'SET_CRITERIA_COLLAPSED':
      return { ...state, criteriaCollapsed: action.criteriaCollapsed };

    default:
      return state;
  }
}

/** Number of criteria with a rating selected. */
export function selectCompletedCount(state: ReviewWorkspaceState): number {
  return Object.values(state.evaluations).filter((e) => e.rating !== null)
    .length;
}

export function selectAllCriteriaMet(state: ReviewWorkspaceState): boolean {
  return Object.values(state.evaluations).every((e) => e.rating === 'Yes');
}

/** All criteria rated + recommendation set + strengths non-empty. */
export function selectCanSubmit(state: ReviewWorkspaceState): boolean {
  return (
    Object.values(state.evaluations).every((e) => e.rating !== null) &&
    state.recommendation !== null &&
    state.generalComments.strengths.trim().length > 0
  );
}
