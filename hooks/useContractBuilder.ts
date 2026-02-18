"use client";

import { useState } from "react";
import type { Contributor } from "@/types/contract";
import {
  mockDrafts,
  mockKnownUsers,
  mockContributors,
  CURRENT_USER_WALLET,
} from "@/lib/mock-data/contract";

export function useContractBuilder() {
  const [selectedDraft, setSelectedDraft] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [contributors, setContributors] = useState<Contributor[]>(mockContributors);
  const [showAddRow, setShowAddRow] = useState(false);
  const [addWallet, setAddWallet] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const totalPct = contributors.reduce((s, c) => s + (Number(c.pct) || 0), 0);
  const isValid = totalPct === 100;
  const signedCount = contributors.filter(c => c.status === "signed").length;
  const allSigned = signedCount === contributors.length;
  const hasSigned = contributors.some(c => c.status === "signed");
  const draft = mockDrafts.find(d => d.id === selectedDraft);

  const updateContributor = (id: number, field: string, value: string | number) => {
    setContributors(prev => prev.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: field === "pct" ? (value === "" ? "" : Number(value)) : value };
      if (hasSigned && c.status === "signed" && c.id !== id) {
        return { ...c, status: "pending" as const, txHash: null, signedAt: null };
      }
      return updated;
    }));
  };

  const removeContributor = (id: number) => {
    setContributors(prev => prev.filter(c => c.id !== id));
  };

  const addContributor = () => {
    const found = mockKnownUsers.find(u => u.wallet === addWallet || u.did === addWallet);
    const newId = Math.max(...contributors.map(c => c.id)) + 1;
    if (found) {
      setContributors(prev => [...prev, {
        id: newId, wallet: found.wallet, did: found.did, name: found.name,
        orcid: found.orcid, pct: 0, role: "", status: "pending" as const, txHash: null, signedAt: null, isCreator: false,
      }]);
    } else if (addWallet.trim()) {
      setContributors(prev => [...prev, {
        id: newId, wallet: addWallet, did: addWallet, name: "Unknown user",
        orcid: "\u2014", pct: 0, role: "", status: "pending" as const, txHash: null, signedAt: null, isCreator: false,
      }]);
    }
    setAddWallet("");
    setShowAddRow(false);
  };

  const handleSign = (id: number) => {
    setContributors(prev => prev.map(c =>
      c.id === id ? {
        ...c,
        status: "signed" as const,
        txHash: "0x" + Math.random().toString(16).slice(2, 6) + "..." + Math.random().toString(16).slice(2, 6),
        signedAt: "2026-02-08 10:15 UTC",
      } : c
    ));
  };

  const handleInvite = () => {
    setInviteLink("https://axiom.pub/invite/c7f2a9e1-3b4d-4e5f");
    setShowInviteModal(true);
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
    // Derived
    totalPct,
    isValid,
    signedCount,
    allSigned,
    hasSigned,
    draft,
    drafts: mockDrafts,
    currentUserWallet: CURRENT_USER_WALLET,
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
