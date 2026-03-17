import type { Role } from '@/src/features/auth/types';

export type Step = 'role-select' | 'wallet' | 'orcid' | 'complete';

export interface State {
  step: Step;
  selectedRole?: Role;
  loading: boolean;
  error?: string;
}

export type Action =
  | { type: 'SELECT_ROLE'; role: Role }
  | { type: 'ADVANCE_TO_ORCID' }
  | { type: 'BACK' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SELECT_ROLE':
      return { ...state, selectedRole: action.role, step: 'wallet' };
    case 'ADVANCE_TO_ORCID':
      return { ...state, step: 'orcid' };
    case 'BACK':
      if (state.step === 'wallet')
        return { ...state, step: 'role-select', selectedRole: undefined };
      if (state.step === 'orcid')
        return { ...state, step: 'wallet', error: undefined };
      return state;
    case 'SUBMIT_START':
      return { ...state, loading: true, error: undefined };
    case 'SUBMIT_SUCCESS':
      return { ...state, step: 'complete', loading: false };
    case 'SUBMIT_ERROR':
      return { ...state, loading: false, error: action.error, step: 'orcid' };
  }
}

export const INITIAL_STATE: State = { step: 'role-select', loading: false };
