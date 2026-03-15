'use client';

import { useReducer, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type {
  Contributor,
  ExistingDraft,
} from '@/src/features/researcher/types/contract';
import { useUser } from '@/src/shared/context/user-context.client';
import { sha256, canonicalJson } from '@/src/shared/lib/hashing';
import { ROUTES } from '@/src/shared/lib/routes';
import type { UserSearchResult } from '@/src/shared/types/domain';
import {
  createContractAction,
  addContributorAction,
  removeContributorAction,
  updateContributorFieldsAction,
  resetSignaturesAction,
  signContractAction,
  generateInviteLinkAction,
} from '@/src/features/contracts/actions';
import {
  contractBuilderReducer,
  initialState,
  selectTotalPct,
  selectIsValid,
  selectAllSigned,
  selectHasSigned,
  selectCurrentUserHasSigned,
} from '@/src/features/researcher/reducers/contract-builder';

/** Manages the authorship contract builder: contributor CRUD, wallet signing, and invite links. */
export function useContractBuilder(initialDrafts: ExistingDraft[]) {
  const { user, account } = useUser();
  const router = useRouter();
  const [state, dispatch] = useReducer(contractBuilderReducer, initialState);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const updateTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

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

  async function handleCreateContract(): Promise<string | null> {
    if (!user) return null;
    const titleForContract = draft?.title ?? state.newTitle.trim();
    if (!titleForContract) return null;

    const newContract = await createContractAction({
      paperTitle: titleForContract,
      paperId: draft?.dbId ?? null,
    });

    const addResults = await Promise.all(
      state.contributors.map((c) =>
        addContributorAction({
          contractId: newContract.id,
          contributorWallet: c.wallet,
          contributorName: c.name !== 'Unknown user' ? c.name : null,
          contributionPct: Number(c.pct) || 0,
          roleDescription: c.role || null,
          isCreator: c.isCreator,
        }),
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
    field: 'pct' | 'role',
    value: string | number,
  ) => {
    const wasSignedBefore = hasSigned;
    const contributor = state.contributors.find((c) => c.id === id);
    dispatch({ type: 'UPDATE_CONTRIBUTOR', id, field, value });

    // Debounced persist to DB if contract already exists
    if (state.selectedContractId && contributor?.dbId) {
      const key = `${id}:${field}`;
      const prev = updateTimers.current.get(key);
      if (prev) clearTimeout(prev);

      const contractId = state.selectedContractId;
      const dbId = contributor.dbId;

      updateTimers.current.set(
        key,
        setTimeout(() => {
          updateTimers.current.delete(key);

          const fields: {
            contributionPct?: number;
            roleDescription?: string | null;
          } = {};
          if (field === 'pct') fields.contributionPct = Number(value) || 0;
          if (field === 'role')
            fields.roleDescription = (value as string) || null;

          const promises: Promise<unknown>[] = [
            updateContributorFieldsAction({
              contractId,
              contributorId: dbId,
              ...fields,
            }),
          ];

          if (wasSignedBefore) {
            promises.push(resetSignaturesAction(contractId));
          }

          Promise.all(promises).catch((err) => {
            console.error('Update contributor fields failed:', err);
            toast.error('Failed to save changes');
          });
        }, 400),
      );
    } else if (wasSignedBefore && state.selectedContractId) {
      // No DB persist needed but signatures still need reset
      resetSignaturesAction(state.selectedContractId).catch((err) => {
        console.error('Reset signatures failed:', err);
        toast.error('Failed to reset signatures');
      });
    }
  };

  const removeContributorHandler = async (id: number) => {
    const contributor = state.contributors.find((c) => c.id === id);
    if (state.selectedContractId && contributor?.dbId) {
      try {
        await removeContributorAction(
          state.selectedContractId,
          contributor.dbId,
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
        const dbResult = await addContributorAction({
          contractId: state.selectedContractId,
          contributorWallet: newContributor.wallet,
          contributorName:
            newContributor.name !== 'Unknown user' ? newContributor.name : null,
          contributionPct: 0,
          roleDescription: null,
          isCreator: false,
        });
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
        txHash: '0x' + Math.random().toString(16).slice(2, 10),
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
      const contractHash = await sha256(canonicalJson(contractPayload));
      const signature = await account.signMessage({ message: contractHash });

      const result = await signContractAction({
        contractId,
        contributorWallet: contributor.wallet,
        signature,
        contractHash,
      });

      setError(null);

      if (result.isFullySigned) {
        toast.success(
          'All contributors have signed! Redirecting to create submission…',
        );
        router.push(ROUTES.researcher.createSubmission);
      } else {
        router.refresh();
        toast.success('Contract signed');
      }
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
      const res = await generateInviteLinkAction(
        state.selectedContractId,
        contributorDbId,
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
    removeContributor: removeContributorHandler,
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
