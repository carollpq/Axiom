"use client";

import { useState } from "react";
import type { ExistingDraft, Contributor } from "@/src/features/researcher/types/contract";
import { ContractBuilderClient } from "@/src/features/researcher/components/contract/ContractBuilderClient";
import { ContractsToSign } from "./ContractsToSign";
import { ContractsStatus } from "./ContractsStatus";

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
            onClick={() => setActiveTab(tab.key)}
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

      {/* Tab content */}
      {activeTab === "build" && (
        <ContractBuilderClient initialDrafts={initialDrafts} />
      )}
      {activeTab === "sign" && (
        <ContractsToSign
          contracts={contractsToSign}
          currentWallet={currentWallet}
        />
      )}
      {activeTab === "status" && (
        <ContractsStatus contracts={ownedContracts} />
      )}
    </div>
  );
}
