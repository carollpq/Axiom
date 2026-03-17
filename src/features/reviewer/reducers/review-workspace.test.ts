/**
 * Tests for review-workspace reducer — pure functions, no mocks.
 */

import {
  createInitialState,
  reviewWorkspaceReducer,
  selectCanSubmit,
  selectAllCriteriaMet,
  selectCompletedCount,
  type ReviewWorkspaceState,
} from './review-workspace';
import type { ReviewCriterion } from '@/src/features/reviewer/types/workspace';

const makeCriteria = (count: number): ReviewCriterion[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    text: `Criterion ${i + 1}`,
    onChainHash: `0xhash${i + 1}`,
  }));

// ===================================================================
// createInitialState
// ===================================================================

describe('createInitialState', () => {
  it('creates fresh state with evaluations per criterion', () => {
    const criteria = makeCriteria(3);
    const state = createInitialState(criteria);
    expect(Object.keys(state.evaluations)).toHaveLength(3);
    for (const c of criteria) {
      expect(state.evaluations[c.id]).toEqual({
        criterionId: c.id,
        rating: null,
        comment: '',
      });
    }
  });

  it('starts with empty generalComments', () => {
    const state = createInitialState(makeCriteria(1));
    expect(state.generalComments).toEqual({
      strengths: '',
      weaknesses: '',
      questionsForAuthors: '',
      confidentialEditorComments: '',
    });
  });

  it('starts with recommendation null, isDraft false (nothing saved yet), criteriaCollapsed false', () => {
    const state = createInitialState(makeCriteria(1));
    expect(state.recommendation).toBeNull();
    expect(state.isDraft).toBe(false);
    expect(state.criteriaCollapsed).toBe(false);
  });

  it('handles 0 criteria → empty evaluations', () => {
    const state = createInitialState([]);
    expect(state.evaluations).toEqual({});
  });

  it('does not crash without assignmentId in Node env (no window)', () => {
    expect(() => createInitialState(makeCriteria(2), undefined)).not.toThrow();
  });
});

// ===================================================================
// reviewWorkspaceReducer
// ===================================================================

describe('reviewWorkspaceReducer', () => {
  let baseState: ReviewWorkspaceState;

  beforeEach(() => {
    baseState = createInitialState(makeCriteria(3));
  });

  it('SET_CRITERION_RATING updates only target criterion', () => {
    const next = reviewWorkspaceReducer(baseState, {
      type: 'SET_CRITERION_RATING',
      id: 2,
      rating: 'Yes',
    });
    expect(next.evaluations[2].rating).toBe('Yes');
    expect(next.evaluations[1].rating).toBeNull();
    expect(next.evaluations[3].rating).toBeNull();
  });

  it('SET_CRITERION_COMMENT preserves existing rating', () => {
    const withRating = reviewWorkspaceReducer(baseState, {
      type: 'SET_CRITERION_RATING',
      id: 1,
      rating: 'No',
    });
    const next = reviewWorkspaceReducer(withRating, {
      type: 'SET_CRITERION_COMMENT',
      id: 1,
      comment: 'Needs work',
    });
    expect(next.evaluations[1].rating).toBe('No');
    expect(next.evaluations[1].comment).toBe('Needs work');
  });

  it('SET_GENERAL_COMMENT updates only targeted field', () => {
    const next = reviewWorkspaceReducer(baseState, {
      type: 'SET_GENERAL_COMMENT',
      field: 'strengths',
      value: 'Great methodology',
    });
    expect(next.generalComments.strengths).toBe('Great methodology');
    expect(next.generalComments.weaknesses).toBe('');
  });

  it('SET_RECOMMENDATION sets value', () => {
    const next = reviewWorkspaceReducer(baseState, {
      type: 'SET_RECOMMENDATION',
      recommendation: 'Accept',
    });
    expect(next.recommendation).toBe('Accept');
  });

  it('SET_RECOMMENDATION clears value with null', () => {
    const withRec = reviewWorkspaceReducer(baseState, {
      type: 'SET_RECOMMENDATION',
      recommendation: 'Accept',
    });
    const next = reviewWorkspaceReducer(withRec, {
      type: 'SET_RECOMMENDATION',
      recommendation: null,
    });
    expect(next.recommendation).toBeNull();
  });

  it('SAVE_DRAFT sets isDraft true', () => {
    const next = reviewWorkspaceReducer(baseState, { type: 'SAVE_DRAFT' });
    expect(next.isDraft).toBe(true);
  });

  it('editing clears isDraft, SAVE_DRAFT restores it', () => {
    // Start: isDraft is false (fresh state)
    expect(baseState.isDraft).toBe(false);

    // Save draft → isDraft becomes true
    const saved = reviewWorkspaceReducer(baseState, { type: 'SAVE_DRAFT' });
    expect(saved.isDraft).toBe(true);

    // Edit → isDraft becomes false
    const edited = reviewWorkspaceReducer(saved, {
      type: 'SET_CRITERION_RATING',
      id: 1,
      rating: 'Yes',
    });
    expect(edited.isDraft).toBe(false);

    // Save again → isDraft becomes true
    const reSaved = reviewWorkspaceReducer(edited, { type: 'SAVE_DRAFT' });
    expect(reSaved.isDraft).toBe(true);
  });

  it('SET_CRITERION_COMMENT clears isDraft', () => {
    const saved = reviewWorkspaceReducer(baseState, { type: 'SAVE_DRAFT' });
    const next = reviewWorkspaceReducer(saved, {
      type: 'SET_CRITERION_COMMENT',
      id: 1,
      comment: 'test',
    });
    expect(next.isDraft).toBe(false);
  });

  it('SET_GENERAL_COMMENT clears isDraft', () => {
    const saved = reviewWorkspaceReducer(baseState, { type: 'SAVE_DRAFT' });
    const next = reviewWorkspaceReducer(saved, {
      type: 'SET_GENERAL_COMMENT',
      field: 'strengths',
      value: 'Good',
    });
    expect(next.isDraft).toBe(false);
  });

  it('SET_RECOMMENDATION clears isDraft', () => {
    const saved = reviewWorkspaceReducer(baseState, { type: 'SAVE_DRAFT' });
    const next = reviewWorkspaceReducer(saved, {
      type: 'SET_RECOMMENDATION',
      recommendation: 'Accept',
    });
    expect(next.isDraft).toBe(false);
  });

  it('SET_CRITERIA_COLLAPSED toggles', () => {
    const next = reviewWorkspaceReducer(baseState, {
      type: 'SET_CRITERIA_COLLAPSED',
      criteriaCollapsed: true,
    });
    expect(next.criteriaCollapsed).toBe(true);
  });

  it('default action returns state unchanged', () => {
    const next = reviewWorkspaceReducer(baseState, {
      type: 'UNKNOWN',
    } as never);
    expect(next).toBe(baseState);
  });

  it('is pure — does not mutate original state', () => {
    const frozen = Object.freeze({ ...baseState });
    expect(() =>
      reviewWorkspaceReducer(frozen as ReviewWorkspaceState, {
        type: 'SET_RECOMMENDATION',
        recommendation: 'Reject',
      }),
    ).not.toThrow();
  });
});

// ===================================================================
// selectCanSubmit
// ===================================================================

describe('selectCanSubmit', () => {
  it('returns false when criteria are unrated', () => {
    const state = createInitialState(makeCriteria(2));
    state.recommendation = 'Accept';
    state.generalComments.strengths = 'Good';
    expect(selectCanSubmit(state)).toBe(false);
  });

  it('returns false with null recommendation', () => {
    const state = createInitialState(makeCriteria(1));
    state.evaluations[1].rating = 'Yes';
    state.generalComments.strengths = 'Good';
    expect(selectCanSubmit(state)).toBe(false);
  });

  it('returns false with empty/whitespace strengths', () => {
    const state = createInitialState(makeCriteria(1));
    state.evaluations[1].rating = 'Yes';
    state.recommendation = 'Accept';
    state.generalComments.strengths = '   ';
    expect(selectCanSubmit(state)).toBe(false);
  });

  it('returns true when all conditions met', () => {
    const state = createInitialState(makeCriteria(2));
    state.evaluations[1].rating = 'Yes';
    state.evaluations[2].rating = 'No';
    state.recommendation = 'Reject';
    state.generalComments.strengths = 'Solid analysis';
    expect(selectCanSubmit(state)).toBe(true);
  });

  it('returns false when 1 of 3 criteria unrated', () => {
    const state = createInitialState(makeCriteria(3));
    state.evaluations[1].rating = 'Yes';
    state.evaluations[2].rating = 'No';
    // 3 left unrated
    state.recommendation = 'Reject';
    state.generalComments.strengths = 'Good';
    expect(selectCanSubmit(state)).toBe(false);
  });
});

// ===================================================================
// selectAllCriteriaMet
// ===================================================================

describe('selectAllCriteriaMet', () => {
  it('returns true when all rated "Yes"', () => {
    const state = createInitialState(makeCriteria(2));
    state.evaluations[1].rating = 'Yes';
    state.evaluations[2].rating = 'Yes';
    expect(selectAllCriteriaMet(state)).toBe(true);
  });

  it('returns false with "No"', () => {
    const state = createInitialState(makeCriteria(2));
    state.evaluations[1].rating = 'Yes';
    state.evaluations[2].rating = 'No';
    expect(selectAllCriteriaMet(state)).toBe(false);
  });

  it('returns false with "Partially"', () => {
    const state = createInitialState(makeCriteria(1));
    state.evaluations[1].rating = 'Partially';
    expect(selectAllCriteriaMet(state)).toBe(false);
  });

  it('returns false with null rating', () => {
    const state = createInitialState(makeCriteria(1));
    expect(selectAllCriteriaMet(state)).toBe(false);
  });

  it('returns true for 0 criteria (vacuous truth)', () => {
    const state = createInitialState([]);
    expect(selectAllCriteriaMet(state)).toBe(true);
  });
});

// ===================================================================
// selectCompletedCount
// ===================================================================

describe('selectCompletedCount', () => {
  it('returns 0 when none rated', () => {
    const state = createInitialState(makeCriteria(3));
    expect(selectCompletedCount(state)).toBe(0);
  });

  it('counts only non-null ratings', () => {
    const state = createInitialState(makeCriteria(3));
    state.evaluations[1].rating = 'Yes';
    state.evaluations[3].rating = 'No';
    expect(selectCompletedCount(state)).toBe(2);
  });
});
