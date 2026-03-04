"use client";

import Link from "next/link";
import type { SignedContract } from "@/src/features/researcher/types/paper-registration";
import { inputStyle } from "./styles";

interface ContractLinkingStepProps {
  selectedContract: string | null;
  contracts: SignedContract[];
  contract: SignedContract | undefined;
  onSelectContract: (id: string | null) => void;
}

export function ContractLinkingStep({ selectedContract, contracts, contract, onSelectContract }: ContractLinkingStepProps) {
  return (
    <div
      className="rounded-lg p-6 mb-5"
      style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)" }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-5">Authorship Contract Linking</div>

      {/* Info banner */}
      <div
        className="py-2.5 px-3.5 mb-[18px] rounded text-[11px] text-[#7a9fc7]"
        style={{ background: "rgba(130,160,200,0.06)", border: "1px solid rgba(130,160,200,0.15)" }}
      >
        Registration (timestamping) can proceed without a contract. Submission to a journal requires a fully signed contract.
      </div>

      {/* Select */}
      <label className="text-[11px] text-[#8a8070] mb-1.5 block">Select Fully Signed Contract</label>
      <select
        value={selectedContract || ""}
        onChange={e => onSelectContract(e.target.value || null)}
        style={{ ...inputStyle, appearance: "none", cursor: "pointer", marginBottom: 16 }}
      >
        <option value="">-- No contract (register only) --</option>
        {contracts.map(c => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>

      {/* Contract detail or empty state */}
      {contract ? (
        <div
          className="p-[18px] rounded-md"
          style={{ background: "rgba(30,28,24,0.4)", border: "1px solid rgba(120,180,120,0.15)" }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[#8fbc8f]">{"\u2713"}</span>
            <span className="text-xs text-[#8fbc8f]">Fully Signed Contract</span>
          </div>
          <div className="mb-2.5">
            <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-1">Paper</div>
            <div className="text-[13px] text-[#d4ccc0]">{contract.title}</div>
          </div>
          <div className="mb-2.5">
            <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-1">Contributors</div>
            <div className="text-xs text-[#b0a898]">{contract.contributors}</div>
          </div>
          <div className="mb-2.5">
            <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-1">Signed On</div>
            <div className="text-xs text-[#8a8070]">{contract.date}</div>
          </div>
          <div className="text-[10px] text-[#5a7a9a] font-mono">Contract hash: {contract.hash} {"\u2197"}</div>
        </div>
      ) : (
        <div
          className="p-[18px] rounded-md text-center"
          style={{ background: "rgba(30,28,24,0.3)", border: "1px dashed rgba(120,110,95,0.2)" }}
        >
          <div className="text-xs text-[#6a6050] mb-2">No contract selected</div>
          <div className="text-[11px] text-[#4a4238] mb-3.5">You can still register your draft for timestamped proof of disclosure</div>
          <Link
            href="/researcher/contract_builder"
            className="inline-block rounded py-2 px-[18px] text-[#7a9fc7] text-xs cursor-pointer font-serif no-underline"
            style={{ background: "none", border: "1px solid rgba(130,160,200,0.25)" }}
          >Create New Contract {"\u2192"}</Link>
        </div>
      )}
    </div>
  );
}
