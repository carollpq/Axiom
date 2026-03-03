"use client";

import { useReducer, useEffect } from "react";
import type { Contributor, ExistingDraft } from "@/src/features/researcher/types/contract";
import { useCurrentUser } from "@/src/shared/hooks/useCurrentUser";
import { fetchApi } from "@/src/shared/lib/api";
import { mockTxHash } from "@/src/shared/lib/format";
import { hashString, canonicalJson } from "@/src/shared/lib/hashing";
import { mapApiContributors } from "@/src/features/researcher/mappers/contract";
import type { ApiContract } from "@/src/shared/types/api";
import {
  contractBuilderReducer,
  initialState,
  selectTotalPct,
  selectIsValid,
  selectAllSigned,
  selectHasSigned,
} from "@/src/features/researcher/reducers/contract-builder";

export function useContractBuilder(initialDrafts: ExistingDraft[]) {
  const { user, account } = useCurrentUser();
  const [state, dispatch] = useReducer(contractBuilderReducer, initialState);

  // When a draft is selected, load its pre-mapped contributors
  useEffect(() => {
    if (state.selectedDraft === null) return;
    const draft = initialDrafts.find((d) => d.id === state.selectedDraft);
    if (!draft) return;

    if (draft.contributors && draft.contributors.length > 0) {
      dispatch({
        type: "SELECT_DRAFT_LOADED",
        contributors: draft.contributors,
        selectedContractId: draft.contractId ?? null,
      });
    } else {
      dispatch({
        type: "SELECT_DRAFT_LOADED",
        contributors: [],
        selectedContractId: null,
      });
    }
  }, [state.selectedDraft, initialDrafts]);

  const currentUserWallet = user?.walletAddress ?? "";
  const totalPct = selectTotalPct(state);
  const isValid = selectIsValid(state);
  const hasSigned = selectHasSigned(state);
  const allSigned = selectAllSigned(state);
  const signedCount = state.contributors.filter((c) => c.status === "signed").length;
  const draft = initialDrafts.find((d) => d.id === state.selectedDraft);

  async function refreshContributors(contractId: string): Promise<void> {
    const fresh = await fetchApi<ApiContract[]>("/api/contracts");
    const match = fresh?.find((c) => c.id === contractId);
    if (match) {
      dispatch({ type: "SET_CONTRIBUTORS", contributors: mapApiContributors(match.contributors) });
    }
  }

  async function handleCreateContract(): Promise<string | null> {
    if (!user) return null;
    const titleForContract = draft?.title ?? state.newTitle.trim();
    if (!titleForContract) return null;

    const newContract = await fetchApi<ApiContract>("/api/contracts", {
      method: "POST",
      body: JSON.stringify({
        paperTitle: titleForContract,
        paperId: draft?.dbId ?? null,
      }),
    });

    const addResults = await Promise.all(
      state.contributors.map((c) =>
        fetchApi<{ id: string }>(`/api/contracts/${newContract.id}/contributors`, {
          method: "POST",
          body: JSON.stringify({
            contributorWallet: c.wallet,
            contributorName: c.name !== "Unknown user" ? c.name : null,
            contributionPct: Number(c.pct) || 0,
            roleDescription: c.role || null,
            isCreator: c.isCreator,
          }),
        }),
      ),
    );

    dispatch({
      type: "CONTRACT_CREATED",
      selectedContractId: newContract.id,
      contributorDbIds: addResults.map((r) => r?.id),
    });
    return newContract.id;
  }

  const updateContributor = (id: number, field: string, value: string | number) => {
    const wasSignedBefore = hasSigned;
    dispatch({ type: "UPDATE_CONTRIBUTOR", id, field, value });
    // Reset signatures in DB if any were signed before this edit
    if (wasSignedBefore && state.selectedContractId) {
      fetchApi(`/api/contracts/${state.selectedContractId}/reset-signatures`, { method: "PATCH" }).catch(
        (err) => console.error("Reset signatures failed:", err),
      );
    }
  };

  const removeContributor = async (id: number) => {
    const contributor = state.contributors.find((c) => c.id === id);
    if (state.selectedContractId && contributor?.dbId) {
      try {
        await fetchApi(
          `/api/contracts/${state.selectedContractId}/contributors?contributorId=${contributor.dbId}`,
          { method: "DELETE" },
        );
      } catch (err) {
        console.error("Remove contributor failed:", err);
        return;
      }
    }
    dispatch({ type: "REMOVE_CONTRIBUTOR", id });
  };

  const addContributor = async () => {
    const newId = Math.max(...state.contributors.map((c) => c.id), 0) + 1;
    const newContributor: Contributor | null = state.addWallet.trim()
      ? {
          id: newId,
          wallet: state.addWallet,
          did: state.addWallet,
          name: "Unknown user",
          orcid: "\u2014",
          pct: 0,
          role: "",
          status: "pending" as const,
          txHash: null,
          signedAt: null,
          isCreator: false,
        }
      : null;

    if (!newContributor) return;

    if (state.selectedContractId) {
      try {
        const result = await fetchApi<{ id: string }>(
          `/api/contracts/${state.selectedContractId}/contributors`,
          {
            method: "POST",
            body: JSON.stringify({
              contributorWallet: newContributor.wallet,
              contributorName: null,
              contributionPct: 0,
              roleDescription: null,
              isCreator: false,
            }),
          },
        );
        newContributor.dbId = result.id;
      } catch (err) {
        console.error("Add contributor failed:", err);
        return;
      }
    }

    dispatch({ type: "ADD_CONTRIBUTOR", contributor: newContributor });
  };

  const handleSign = async (id: number) => {
    const contributor = state.contributors.find((c) => c.id === id);

    if (!contributor || !account || !user) {
      dispatch({
        type: "SIGN_DEMO",
        id,
        txHash: mockTxHash(),
        signedAt: new Date().toISOString(),
      });
      return;
    }

    try {
      const contractId = state.selectedContractId ?? (await handleCreateContract());
      if (!contractId) {
        console.error("Could not create contract before signing");
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
        method: "POST",
        body: JSON.stringify({
          contributorWallet: contributor.wallet,
          signature,
          contractHash,
        }),
      });

      await refreshContributors(contractId);
    } catch (err) {
      console.error("Signing failed:", err);
    }
  };

  const handleInvite = async (contributorDbId?: string) => {
    if (!state.selectedContractId || !contributorDbId) {
      dispatch({ type: "SHOW_INVITE_MODAL", inviteLink: "" });
      return;
    }
    try {
      const res = await fetchApi<{ inviteLink: string }>(
        `/api/contracts/${state.selectedContractId}/invite`,
        {
          method: "POST",
          body: JSON.stringify({ contributorId: contributorDbId }),
        },
      );
      dispatch({ type: "SHOW_INVITE_MODAL", inviteLink: res.inviteLink });
    } catch (err) {
      console.error("Invite generation failed:", err);
    }
  };

  const closeInviteModal = () => dispatch({ type: "CLOSE_INVITE_MODAL" });

  return {
    // State
    selectedDraft: state.selectedDraft,
    newTitle: state.newTitle,
    contributors: state.contributors,
    showAddRow: state.showAddRow,
    addWallet: state.addWallet,
    showPreview: state.showPreview,
    showInviteModal: state.showInviteModal,
    inviteLink: state.inviteLink,
    selectedContractId: state.selectedContractId,
    // Derived
    totalPct,
    isValid,
    signedCount,
    allSigned,
    hasSigned,
    draft,
    drafts: initialDrafts,
    currentUserWallet,
    // Handlers
    setSelectedDraft: (selectedDraft: number | null) => dispatch({ type: "SET_SELECTED_DRAFT", selectedDraft }),
    setNewTitle: (newTitle: string) => dispatch({ type: "SET_NEW_TITLE", newTitle }),
    setShowAddRow: (showAddRow: boolean) => dispatch({ type: "SET_SHOW_ADD_ROW", showAddRow }),
    setAddWallet: (addWallet: string) => dispatch({ type: "SET_ADD_WALLET", addWallet }),
    setShowPreview: (showPreview: boolean) => dispatch({ type: "SET_SHOW_PREVIEW", showPreview }),
    updateContributor,
    removeContributor,
    addContributor,
    handleSign,
    handleInvite,
    closeInviteModal,
  };
}
