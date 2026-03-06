"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { ExistingDraft } from "@/src/features/researcher/types/contract";
import { ContractsStatus } from "./ContractsStatus";

const ContractBuilder = dynamic(
  () => import("@/src/features/researcher/components/contract/ContractBuilderClient"),
  { loading: () => <div className="p-6 text-[13px] text-[#6a6050]">Loading contract builder...</div> }
);
const ContractsToSign = dynamic(
  () => import("./ContractsToSign"),
  { loading: () => <div className="p-6 text-[13px] text-[#6a6050]">Loading contracts...</div> }
);

type Tab = "build" | "sign" | "status";

interface ContractForSigning {
  id: string;
  paperTitle: string;
  contributors: {
    name: string;
    role: string;
    pct: number;
    status: string;
    wallet: string;
  }[];
}

interface ContractWithStatus {
  id: string;
  paperTitle: string;
  allSigned: boolean;
  pendingCount: number;
  contributors: {
    name: string;
    role: string;
    pct: number;
    status: string;
  }[];
}

interface Props {
  initialDrafts: ExistingDraft[];
  contractsToSign: ContractForSigning[];
  ownedContracts: ContractWithStatus[];
  currentWallet: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "build", label: "Build New Contract" },
  { key: "sign", label: "Contracts To Sign" },
  { key: "status", label: "Your Contracts Status" },
];

export function AuthorshipContractsTabs({
  initialDrafts,
  contractsToSign,
  ownedContracts,
  currentWallet,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("build");
  const [visited, setVisited] = useState<Set<Tab>>(new Set<Tab>(["build"]));

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setVisited((prev) => (prev.has(tab) ? prev : new Set(prev).add(tab)));
  };

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      <h1 className="text-[28px] font-serif font-normal text-[#e8e0d4] mb-1">
        Authorship Contracts
      </h1>
      <p className="text-[13px] text-[#6a6050] italic mb-6">
        Create, sign, and track authorship contracts
      </p>

      {/* Tabs */}
      <div
        className="flex gap-0 mb-6"
        style={{ borderBottom: "1px solid rgba(120,110,95,0.2)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchTab(tab.key)}
            className="px-5 py-3 text-[13px] font-serif cursor-pointer transition-colors"
            style={{
              color: activeTab === tab.key ? "#e8e0d4" : "#6a6050",
              borderBottom:
                activeTab === tab.key
                  ? "2px solid #c9a44a"
                  : "2px solid transparent",
              background: "transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — lazy-loaded, stays mounted once visited to preserve state */}
      {visited.has("build") && (
        <div style={{ display: activeTab === "build" ? undefined : "none" }}>
          <ContractBuilder initialDrafts={initialDrafts} />
        </div>
      )}
      {visited.has("sign") && (
        <div style={{ display: activeTab === "sign" ? undefined : "none" }}>
          <ContractsToSign contracts={contractsToSign} currentWallet={currentWallet} />
        </div>
      )}
      {visited.has("status") && (
        <div style={{ display: activeTab === "status" ? undefined : "none" }}>
          <ContractsStatus contracts={ownedContracts} />
        </div>
      )}
    </div>
  );
}
