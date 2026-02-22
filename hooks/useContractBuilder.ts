"use client";

import { useState, useEffect } from "react";
import type { Contributor, ExistingDraft } from "@/types/contract";
import {
  mockDrafts,
  mockKnownUsers,
  mockContributors,
  CURRENT_USER_WALLET,
} from "@/lib/mock-data/contract";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { fetchApi } from "@/lib/api";

interface DbPaper {
  id: string;
  title: string;
  status: string;
  versions?: { paperHash: string }[];
}

interface DbContractContributor {
  id: string;
  contributorWallet: string;
  contributorName: string | null;
  contributionPct: number;
  roleDescription: string | null;
  status: string;
  signature: string | null;
  signedAt: string | null;
  isCreator: boolean;
}

interface DbContract {
  id: string;
  paperTitle: string;
  paperId: string | null;
  status: string;
  contractHash: string | null;
  contributors: DbContractContributor[];
}

function mapDbContributors(dbContribs: DbContractContributor[]): Contributor[] {
  return dbContribs.map((c, i) => ({
    id: i + 1,
    wallet: c.contributorWallet,
    did: c.contributorWallet,
    name: c.contributorName ?? "Unknown user",
    orcid: "\u2014",
    pct: c.contributionPct,
    role: c.roleDescription ?? "",
    status: c.status as Contributor["status"],
    txHash: c.signature ?? null,
    signedAt: c.signedAt ?? null,
    isCreator: c.isCreator,
  }));
}

export function useContractBuilder() {
  const { user, isConnected } = useCurrentUser();

  const [selectedDraft, setSelectedDraft] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [contributors, setContributors] = useState<Contributor[]>(mockContributors);
  const [showAddRow, setShowAddRow] = useState(false);
  const [addWallet, setAddWallet] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  // DB-fetched drafts and contracts
  const [dbDrafts, setDbDrafts] = useState<ExistingDraft[] | null>(null);
  const [dbContracts, setDbContracts] = useState<DbContract[] | null>(null);

  // Fetch papers (drafts) from API when connected
  useEffect(() => {
    if (!isConnected || !user) {
      setDbDrafts(null);
      setDbContracts(null);
      return;
    }

    let cancelled = false;

    fetchApi<DbPaper[]>(`/api/papers?wallet=${user.walletAddress}`)
      .then((data) => {
        if (cancelled) return;
        const drafts = data
          .filter((p) => p.status === "draft" || p.status === "contract_pending")
          .map((p, i) => ({
            id: i + 1,
            title: p.title,
            hash: p.versions?.[0]?.paperHash ?? "\u2014",
            _dbId: p.id,
          }));
        setDbDrafts(drafts);
      })
      .catch(() => {
        if (!cancelled) setDbDrafts(null);
      });

    fetchApi<DbContract[]>(`/api/contracts?wallet=${user.walletAddress}`)
      .then((data) => {
        if (!cancelled) setDbContracts(data);
      })
      .catch(() => {
        if (!cancelled) setDbContracts(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isConnected, user]);

  const drafts = dbDrafts ?? mockDrafts;

  // When a draft is selected, load its contract contributors if available
  useEffect(() => {
    if (selectedDraft === null || !dbContracts) return;

    const draft = drafts[selectedDraft - 1];
    if (!draft) return;

    // Find a contract matching this paper title
    const matchingContract = dbContracts.find(
      (c) => c.paperTitle === draft.title
    );

    if (matchingContract && matchingContract.contributors.length > 0) {
      setContributors(mapDbContributors(matchingContract.contributors));
    }
  }, [selectedDraft, dbContracts, drafts]);

  const currentUserWallet = isConnected && user
    ? user.walletAddress
    : CURRENT_USER_WALLET;

  const totalPct = contributors.reduce((s, c) => s + (Number(c.pct) || 0), 0);
  const isValid = totalPct === 100;
  const signedCount = contributors.filter(c => c.status === "signed").length;
  const allSigned = signedCount === contributors.length;
  const hasSigned = contributors.some(c => c.status === "signed");
  const draft = drafts.find(d => d.id === selectedDraft);

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
    drafts,
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
