'use client';

import { useReducer, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveAccount } from 'thirdweb/react';
import { isLoggedIn } from '@/src/shared/lib/auth/actions';
import { ROLE_DASHBOARD_ROUTES } from '@/src/shared/lib/routes';
import type { Role } from '@/src/features/auth/types';
import { RoleSelector } from './role-selector.client';
import { OrcidVerificationStep } from './orcid-verification-step.client';
import { WalletConnectStep } from './wallet-connect-step.client';
import { ErrorAlert } from '@/src/shared/components/error-alert';
import { AuthHeader } from './auth-header';

type Step = 'role-select' | 'wallet' | 'orcid' | 'complete';

interface State {
  step: Step;
  selectedRole?: Role;
  loading: boolean;
  error?: string;
}

type Action =
  | { type: 'SELECT_ROLE'; role: Role }
  | { type: 'ADVANCE_TO_ORCID' }
  | { type: 'BACK' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; error: string };

function reducer(state: State, action: Action): State {
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

const INITIAL_STATE: State = { step: 'role-select', loading: false };

export function Registration() {
  const router = useRouter();
  const account = useActiveAccount();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // If wallet already connected, verify session before advancing to ORCID
  useEffect(() => {
    if (!account?.address || state.step !== 'wallet') return;
    let cancelled = false;

    isLoggedIn(account.address).then((loggedIn) => {
      if (!cancelled && loggedIn) {
        dispatch({ type: 'ADVANCE_TO_ORCID' });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [account?.address, state.step]);

  // Redirect after successful registration
  useEffect(() => {
    if (state.step !== 'complete' || !state.selectedRole) return;
    const timeout = setTimeout(() => {
      router.push(ROLE_DASHBOARD_ROUTES[state.selectedRole!]);
    }, 500);
    return () => clearTimeout(timeout);
  }, [state.step, state.selectedRole, router]);

  const handleOrcidVerified = async (orcidId: string, displayName: string) => {
    dispatch({ type: 'SUBMIT_START' });

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: state.selectedRole,
          orcidId,
          displayName,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.error || 'Registration failed');
      }

      dispatch({ type: 'SUBMIT_SUCCESS' });
    } catch (err) {
      dispatch({
        type: 'SUBMIT_ERROR',
        error: err instanceof Error ? err.message : 'Registration failed',
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AuthHeader subtitle="Create your account" />

      {/* Error Alert */}
      {state.error && (
        <div className="mb-6">
          <ErrorAlert message={state.error} />
        </div>
      )}

      {/* Step Content */}
      {state.step === 'role-select' && (
        <RoleSelector
          onSelect={(role) => dispatch({ type: 'SELECT_ROLE', role })}
        />
      )}

      {state.step === 'wallet' && state.selectedRole && (
        <WalletConnectStep
          selectedRole={state.selectedRole}
          hasAccount={!!account?.address}
          onBack={() => dispatch({ type: 'BACK' })}
          onContinue={() => dispatch({ type: 'ADVANCE_TO_ORCID' })}
        />
      )}

      {state.step === 'orcid' && (
        <OrcidVerificationStep
          onVerified={handleOrcidVerified}
          onBack={() => dispatch({ type: 'BACK' })}
          loading={state.loading}
        />
      )}

      {state.step === 'complete' && (
        <div
          className="text-center p-6 rounded"
          style={{ backgroundColor: 'rgba(45, 42, 38, 0.6)' }}
        >
          <div className="text-lg mb-4" style={{ color: '#8fbc8f' }}>
            Registration successful
          </div>
          <p style={{ color: '#b0a898' }}>Redirecting to dashboard...</p>
        </div>
      )}

      {/* Link to login */}
      {state.step !== 'complete' && (
        <p className="text-center text-sm mt-6" style={{ color: '#8a8070' }}>
          Already have an account?{' '}
          <a href="/login" className="underline" style={{ color: '#c9a44a' }}>
            Log in
          </a>
        </p>
      )}
    </div>
  );
}
