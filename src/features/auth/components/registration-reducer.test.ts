/**
 * Tests for the registration state machine reducer.
 */
import { reducer, INITIAL_STATE, type State } from './registration-reducer';

describe('registration reducer', () => {
  describe('INITIAL_STATE', () => {
    it('starts at role-select with loading=false', () => {
      expect(INITIAL_STATE).toEqual({
        step: 'role-select',
        loading: false,
      });
    });
  });

  describe('SELECT_ROLE', () => {
    it('sets role and advances to wallet step', () => {
      const result = reducer(INITIAL_STATE, {
        type: 'SELECT_ROLE',
        role: 'researcher',
      });
      expect(result.selectedRole).toBe('researcher');
      expect(result.step).toBe('wallet');
    });
  });

  describe('ADVANCE_TO_ORCID', () => {
    it('moves to orcid step', () => {
      const state: State = {
        ...INITIAL_STATE,
        step: 'wallet',
        selectedRole: 'editor',
      };
      const result = reducer(state, { type: 'ADVANCE_TO_ORCID' });
      expect(result.step).toBe('orcid');
    });
  });

  describe('BACK', () => {
    it('from wallet → returns to role-select, clears role', () => {
      const state: State = {
        ...INITIAL_STATE,
        step: 'wallet',
        selectedRole: 'reviewer',
      };
      const result = reducer(state, { type: 'BACK' });
      expect(result.step).toBe('role-select');
      expect(result.selectedRole).toBeUndefined();
    });

    it('from orcid → returns to wallet, clears error', () => {
      const state: State = {
        ...INITIAL_STATE,
        step: 'orcid',
        selectedRole: 'researcher',
        error: 'some error',
      };
      const result = reducer(state, { type: 'BACK' });
      expect(result.step).toBe('wallet');
      expect(result.error).toBeUndefined();
    });

    it('from role-select → no-op', () => {
      const result = reducer(INITIAL_STATE, { type: 'BACK' });
      expect(result).toEqual(INITIAL_STATE);
    });

    it('from complete → no-op', () => {
      const state: State = { ...INITIAL_STATE, step: 'complete' };
      const result = reducer(state, { type: 'BACK' });
      expect(result).toBe(state);
    });
  });

  describe('SUBMIT_START', () => {
    it('sets loading=true and clears error', () => {
      const state: State = {
        ...INITIAL_STATE,
        step: 'orcid',
        error: 'old error',
      };
      const result = reducer(state, { type: 'SUBMIT_START' });
      expect(result.loading).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('SUBMIT_SUCCESS', () => {
    it('sets step=complete and loading=false', () => {
      const state: State = { ...INITIAL_STATE, step: 'orcid', loading: true };
      const result = reducer(state, { type: 'SUBMIT_SUCCESS' });
      expect(result.step).toBe('complete');
      expect(result.loading).toBe(false);
    });
  });

  describe('SUBMIT_ERROR', () => {
    it('sets error, reverts to orcid, loading=false', () => {
      const state: State = { ...INITIAL_STATE, step: 'orcid', loading: true };
      const result = reducer(state, {
        type: 'SUBMIT_ERROR',
        error: 'Registration failed',
      });
      expect(result.error).toBe('Registration failed');
      expect(result.step).toBe('orcid');
      expect(result.loading).toBe(false);
    });
  });
});
