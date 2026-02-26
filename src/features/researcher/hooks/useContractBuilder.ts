"use client";

import { useState, useEffect } from "react";
import type { Contributor, ExistingDraft } from "@/src/features/researcher/types/contract";
import { useCurrentUser } from "@/src/shared/hooks/useCurrentUser";
import { fetchApi } from "@/src/shared/lib/api";
import { hashString, canonicalJson } from "@/src/shared/lib/hashing";
import { mapApiContributors } from "@/src/features/researcher/mappers/contract";
import type { ApiContract } from "@/src/shared/types/api";

export function useContractBuilder(initialDrafts: ExistingDraft[]) {
  const { user, account } = useCurrentUser();

  const [selectedDraft, setSelectedDraft] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [showAddRow, setShowAddRow] = useState(false);
  const [addWallet, setAddWallet] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  // When a draft is selected, load its pre-mapped contributors
  useEffect(() => {
    if (selectedDraft === null) return;
    const draft = initialDrafts.find((d) => d.id === selectedDraft);
    if (!draft) return;

    if (draft.contributors && draft.contributors.length > 0) {
      setContributors(draft.contributors);
      setSelectedContractId(draft.contractId ?? null);
    } else {
      setContributors([]);
      setSelectedContractId(null);
    }
  }, [selectedDraft, initialDrafts]);

  const currentUserWallet = user?.walletAddress ?? "";

  const totalPct = contributors.reduce((s, c) => s + (Number(c.pct) || 0), 0);
  const isValid = totalPct === 100;
  const signedCount = contributors.filter((c) => c.status === "signed").length;
  const allSigned = contributors.length > 0 && signedCount === contributors.length;
  const hasSigned = contributors.some((c) => c.status === "signed");
  const draft = initialDrafts.find((d) => d.id === selectedDraft);

  async function refreshContributors(contractId: string): Promise<void> {
    const fresh = await fetchApi<ApiContract[]>("/api/contracts");
    const match = fresh?.find((c) => c.id === contractId);
    if (match) {
      setContributors(mapApiContributors(match.contributors));
    }
  }

  async function handleCreateContract(): Promise<string | null> {
    if (!user) return null;
    const titleForContract = draft?.title ?? newTitle.trim();
    if (!titleForContract) return null;

    const newContract = await fetchApi<ApiContract>("/api/contracts", {
      method: "POST",
      body: JSON.stringify({
        paperTitle: titleForContract,
        paperId: draft?.dbId ?? null,
      }),
    });

    const addResults = await Promise.all(
      contributors.map((c) =>
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

    setContributors((prev) =>
      prev.map((c, i) => ({ ...c, dbId: addResults[i]?.id })),
    );
    setSelectedContractId(newContract.id);
    return newContract.id;
  }

  const updateContributor = (id: number, field: string, value: string | number) => {
    const wasSignedBefore = hasSigned;
    setContributors((prev) =>
      prev.map((c) => {
        if (c.id !== id) {
          // Reset ALL signed contributors when ANY field changes
          if (wasSignedBefore && c.status === "signed") {
            return { ...c, status: "pending" as const, txHash: null, signedAt: null };
          }
          return c;
        }
        return {
          ...c,
          [field]: field === "pct" ? (value === "" ? "" : Number(value)) : value,
          ...(wasSignedBefore && c.status === "signed"
            ? { status: "pending" as const, txHash: null, signedAt: null }
            : {}),
        };
      }),
    );
    // Reset signatures in DB if any were signed before this edit
    if (wasSignedBefore && selectedContractId) {
      fetchApi(`/api/contracts/${selectedContractId}/reset-signatures`, { method: "PATCH" }).catch(
        (err) => console.error("Reset signatures failed:", err),
      );
    }
  };

  const removeContributor = async (id: number) => {
    const contributor = contributors.find((c) => c.id === id);
    if (selectedContractId && contributor?.dbId) {
      try {
        await fetchApi(
          `/api/contracts/${selectedContractId}/contributors?contributorId=${contributor.dbId}`,
          { method: "DELETE" },
        );
      } catch (err) {
        console.error("Remove contributor failed:", err);
        return;
      }
    }
    setContributors((prev) => prev.filter((c) => c.id !== id));
  };

  const addContributor = async () => {
    const newId = Math.max(...contributors.map((c) => c.id), 0) + 1;
    const newContributor: Contributor | null = addWallet.trim()
      ? {
          id: newId,
          wallet: addWallet,
          did: addWallet,
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

    if (selectedContractId) {
      try {
        const result = await fetchApi<{ id: string }>(
          `/api/contracts/${selectedContractId}/contributors`,
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

    setContributors((prev) => [...prev, newContributor]);
    setAddWallet("");
    setShowAddRow(false);
  };

  const handleSign = async (id: number) => {
    const contributor = contributors.find((c) => c.id === id);

    if (!contributor || !account || !user) {
      setContributors((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: "signed" as const,
                txHash:
                  "0x" +
                  Math.random().toString(16).slice(2, 6) +
                  "..." +
                  Math.random().toString(16).slice(2, 6),
                signedAt: new Date().toISOString(),
              }
            : c,
        ),
      );
      return;
    }

    try {
      const contractId = selectedContractId ?? (await handleCreateContract());
      if (!contractId) {
        console.error("Could not create contract before signing");
        return;
      }

      const contractPayload = {
        paperTitle: draft?.title ?? newTitle,
        contributors: contributors.map((c) => ({
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
    if (!selectedContractId || !contributorDbId) {
      // Fallback: open modal with empty link if no contract persisted yet
      setInviteLink("");
      setShowInviteModal(true);
      return;
    }
    try {
      const res = await fetchApi<{ inviteLink: string }>(
        `/api/contracts/${selectedContractId}/invite`,
        {
          method: "POST",
          body: JSON.stringify({ contributorId: contributorDbId }),
        },
      );
      setInviteLink(res.inviteLink);
      setShowInviteModal(true);
    } catch (err) {
      console.error("Invite generation failed:", err);
    }
  };

  const closeInviteModal = () => setShowInviteModal(false);

  return {
    // State
    selectedDraft,
    newTitle,
    contributors,
    showAddRow,
    addWallet,
    showPreview,
    showInviteModal,
    inviteLink,
    selectedContractId,
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
    setSelectedDraft,
    setNewTitle,
    setShowAddRow,
    setAddWallet,
    setShowPreview,
    updateContributor,
    removeContributor,
    addContributor,
    handleSign,
    handleInvite,
    closeInviteModal,
  };
}
