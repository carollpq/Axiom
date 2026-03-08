'use client';

import { useReducer, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type {
  Contributor,
  ExistingDraft,
} from '@/src/features/researcher/types/contract';
import { useCurrentUser } from '@/src/shared/hooks/useCurrentUser';
import { fetchApi } from '@/src/shared/lib/api';
import { mockTxHash } from '@/src/shared/lib/format';
import { hashString, canonicalJson } from '@/src/shared/lib/hashing';
import { mapApiContributors } from '@/src/features/researcher/mappers/contract';
import type { ApiContract, UserSearchResult } from '@/src/shared/types/api';
import {
  contractBuilderReducer,
  initialState,
  selectTotalPct,
  selectIsValid,
  selectAllSigned,
  selectHasSigned,
  selectCurrentUserHasSigned,
} from '@/src/features/researcher/reducers/contract-builder';

export function useContractBuilder(initialDrafts: ExistingDraft[]) {
  const { user, account } = useCurrentUser();
  const [state, dispatch] = useReducer(contractBuilderReducer, initialState);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // When a draft is selected, load its pre-mapped contributors
  useEffect(() => {
    if (state.selectedDraft === null) return;
    const draft = initialDrafts.find((d) => d.id === state.selectedDraft);
    if (!draft) return;

    if (draft.contributors && draft.contributors.length > 0) {
      dispatch({
        type: 'SELECT_DRAFT_LOADED',
        contributors: draft.contributors,
        selectedContractId: draft.contractId ?? null,
      });
    } else {
      dispatch({
        type: 'SELECT_DRAFT_LOADED',
        contributors: [],
        selectedContractId: null,
      });
    }
  }, [state.selectedDraft, initialDrafts]);

  const currentUserWallet = user?.walletAddress ?? '';
  const totalPct = selectTotalPct(state);
  const isValid = selectIsValid(state);
  const hasSigned = selectHasSigned(state);
  const hasCurrentUserSigned = selectCurrentUserHasSigned(
    state,
    currentUserWallet,
  );
  const allSigned = selectAllSigned(state);
  const signedCount = state.contributors.filter(
    (c) => c.status === 'signed',
  ).length;
  const draft = initialDrafts.find((d) => d.id === state.selectedDraft);

  async function refreshContributors(contractId: string): Promise<void> {
    const fresh = await fetchApi<ApiContract[]>('/api/contracts');
    const match = fresh?.find((c) => c.id === contractId);
    if (match) {
      dispatch({
        type: 'SET_CONTRIBUTORS',
        contributors: mapApiContributors(match.contributors),
      });
    }
  }

  async function handleCreateContract(): Promise<string | null> {
    if (!user) return null;
    const titleForContract = draft?.title ?? state.newTitle.trim();
    if (!titleForContract) return null;

    const newContract = await fetchApi<ApiContract>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify({
        paperTitle: titleForContract,
        paperId: draft?.dbId ?? null,
      }),
    });

    const addResults = await Promise.all(
      state.contributors.map((c) =>
        fetchApi<{ id: string }>(
          `/api/contracts/${newContract.id}/contributors`,
          {
            method: 'POST',
            body: JSON.stringify({
              contributorWallet: c.wallet,
              contributorName: c.name !== 'Unknown user' ? c.name : null,
              contributionPct: Number(c.pct) || 0,
              roleDescription: c.role || null,
              isCreator: c.isCreator,
            }),
          },
        ),
      ),
    );

    dispatch({
      type: 'CONTRACT_CREATED',
      selectedContractId: newContract.id,
      contributorDbIds: addResults.map((r) => r?.id),
    });
    return newContract.id;
  }

  const updateContributor = (
    id: number,
    field: string,
    value: string | number,
  ) => {
    const wasSignedBefore = hasSigned;
    dispatch({ type: 'UPDATE_CONTRIBUTOR', id, field, value });
    // Reset signatures in DB if any were signed before this edit
    if (wasSignedBefore && state.selectedContractId) {
      fetchApi(`/api/contracts/${state.selectedContractId}/reset-signatures`, {
        method: 'PATCH',
      }).catch((err) => {
        console.error('Reset signatures failed:', err);
        toast.error('Failed to reset signatures');
      });
    }
  };

  const removeContributor = async (id: number) => {
    const contributor = state.contributors.find((c) => c.id === id);
    if (state.selectedContractId && contributor?.dbId) {
      try {
        await fetchApi(
          `/api/contracts/${state.selectedContractId}/contributors/${contributor.dbId}`,
          { method: 'DELETE' },
        );
      } catch (err) {
        console.error('Remove contributor failed:', err);
        toast.error('Failed to remove contributor');
        return;
      }
    }
    dispatch({ type: 'REMOVE_CONTRIBUTOR', id });
  };

  const addContributorFromSearch = async (result: UserSearchResult) => {
    const newId = Math.max(...state.contributors.map((c) => c.id), 0) + 1;
    const newContributor: Contributor = {
      id: newId,
      wallet: result.walletAddress,
      did: result.walletAddress,
      name: result.displayName || 'Unknown user',
      orcid: result.orcidId || '\u2014',
      pct: 0,
      role: '',
      status: 'pending' as const,
      txHash: null,
      signedAt: null,
      isCreator: false,
    };

    if (state.selectedContractId) {
      try {
        const dbResult = await fetchApi<{ id: string }>(
          `/api/contracts/${state.selectedContractId}/contributors`,
          {
            method: 'POST',
            body: JSON.stringify({
              contributorWallet: newContributor.wallet,
              contributorName:
                newContributor.name !== 'Unknown user'
                  ? newContributor.name
                  : null,
              contributionPct: 0,
              roleDescription: null,
              isCreator: false,
            }),
          },
        );
        newContributor.dbId = dbResult.id;
        setError(null);
      } catch (err) {
        console.error('Add contributor failed:', err);
        setError('Failed to add contributor.');
        toast.error('Failed to add contributor');
        return;
      }
    }

    dispatch({ type: 'ADD_CONTRIBUTOR', contributor: newContributor });
    toast.success('Contributor added');
  };

  const handleSign = async (id: number) => {
    const contributor = state.contributors.find((c) => c.id === id);

    if (!contributor || !account || !user) {
      dispatch({
        type: 'SIGN_DEMO',
        id,
        txHash: mockTxHash(),
        signedAt: new Date().toISOString(),
      });
      return;
    }

    try {
      const contractId =
        state.selectedContractId ?? (await handleCreateContract());
      if (!contractId) {
        console.error('Could not create contract before signing');
        return;
      }

      const contractPayload = {
        paperTitle: draft?.title ?? state.newTitle,
        contributors: state.contributors.map((c) => ({
          wallet: c.wallet,
          name: c.name,
          pct: c.pct,
          role: c.role,
        })),
      };
      const contractHash = await hashString(canonicalJson(contractPayload));
      const signature = await account.signMessage({ message: contractHash });

      await fetchApi(`/api/contracts/${contractId}/sign`, {
        method: 'POST',
        body: JSON.stringify({
          contributorWallet: contributor.wallet,
          signature,
          contractHash,
        }),
      });

      setError(null);
      await refreshContributors(contractId);
      toast.success('Contract signed');
    } catch (err) {
      console.error('Signing failed:', err);
      setError('Signing failed. Please try again.');
      toast.error('Signing failed. Please try again.');
    }
  };

  const handleInvite = async (contributorDbId?: string) => {
    if (!state.selectedContractId || !contributorDbId) {
      dispatch({ type: 'SHOW_INVITE_MODAL', inviteLink: '' });
      return;
    }
    try {
      const res = await fetchApi<{ inviteLink: string }>(
        `/api/contracts/${state.selectedContractId}/invite`,
        {
          method: 'POST',
          body: JSON.stringify({ contributorId: contributorDbId }),
        },
      );
      setError(null);
      dispatch({ type: 'SHOW_INVITE_MODAL', inviteLink: res.inviteLink });
    } catch (err) {
      console.error('Invite generation failed:', err);
      setError('Failed to generate invite link.');
      toast.error('Failed to generate invite link');
    }
  };

  const closeInviteModal = () => dispatch({ type: 'CLOSE_INVITE_MODAL' });

  return {
    // State
    selectedDraft: state.selectedDraft,
    newTitle: state.newTitle,
    contributors: state.contributors,
    showAddRow: state.showAddRow,
    showPreview: state.showPreview,
    showInviteModal: state.showInviteModal,
    inviteLink: state.inviteLink,
    selectedContractId: state.selectedContractId,
    error,
    // Derived
    totalPct,
    isValid,
    signedCount,
    allSigned,
    hasSigned,
    hasCurrentUserSigned,
    draft,
    drafts: initialDrafts,
    currentUserWallet,
    // Handlers
    setSelectedDraft: (selectedDraft: number | null) =>
      dispatch({ type: 'SET_SELECTED_DRAFT', selectedDraft }),
    setNewTitle: (newTitle: string) =>
      dispatch({ type: 'SET_NEW_TITLE', newTitle }),
    setShowAddRow: (showAddRow: boolean) =>
      dispatch({ type: 'SET_SHOW_ADD_ROW', showAddRow }),
    setShowPreview: (showPreview: boolean) =>
      dispatch({ type: 'SET_SHOW_PREVIEW', showPreview }),
    updateContributor,
    removeContributor,
    addContributorFromSearch,
    generating,
    generateContract: async () => {
      try {
        setError(null);
        setGenerating(true);
        const id = await handleCreateContract();
        if (!id) {
          setError('Please select a paper or enter a title first.');
        } else {
          toast.success('Contract created');
        }
      } catch (err) {
        console.error('Generate contract failed:', err);
        setError('Failed to generate contract.');
        toast.error('Failed to generate contract');
      } finally {
        setGenerating(false);
      }
    },
    handleSign,
    handleInvite,
    closeInviteModal,
  };
}
