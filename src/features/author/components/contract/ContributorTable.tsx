"use client";

import type { Contributor } from "@/src/features/author/types/contract";
import { PercentageBar } from "./PercentageBar";
import { ContributorRow } from "./ContributorRow";

interface ContributorTableProps {
  contributors: Contributor[];
  totalPct: number;
  isValid: boolean;
  hasSigned: boolean;
  currentUserWallet: string;
  showAddRow: boolean;
  addWallet: string;
  onUpdate: (id: number, field: string, value: string | number) => void;
  onRemove: (id: number) => void | Promise<void>;
  onSign: (id: number) => void | Promise<void>;
  onAdd: () => void | Promise<void>;
  onInvite: () => void;
  onSetShowAddRow: (show: boolean) => void;
  onSetAddWallet: (wallet: string) => void;
}

export function ContributorTable({
  contributors, totalPct, isValid, hasSigned, currentUserWallet,
  showAddRow, addWallet,
  onUpdate, onRemove, onSign, onAdd, onInvite, onSetShowAddRow, onSetAddWallet,
}: ContributorTableProps) {
  return (
    <div className="rounded-lg p-6 mb-6" style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)" }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px]">Contributors</div>
        <PercentageBar totalPct={totalPct} isValid={isValid} />
      </div>

      {/* Validation warning */}
      {!isValid && (
        <div
          className="py-2 px-3.5 mb-4 rounded text-[11px]"
          style={{
            background: totalPct > 100 ? "rgba(200,100,90,0.08)" : "rgba(200,160,100,0.08)",
            border: "1px solid " + (totalPct > 100 ? "rgba(200,100,90,0.2)" : "rgba(200,160,100,0.2)"),
            color: totalPct > 100 ? "#d4645a" : "#c4956a",
          }}
        >
          {totalPct > 100
            ? "Total exceeds 100%. Please adjust contribution percentages."
            : "Contributions must sum to exactly 100% before signatures can be collected."}
        </div>
      )}

      {/* Table header */}
      <div
        className="grid py-2.5 px-3.5 rounded-t-md text-[10px] text-[#6a6050] uppercase tracking-[1.2px] gap-2"
        style={{
          gridTemplateColumns: "1.8fr 0.8fr 0.5fr 1.2fr 0.8fr 0.3fr",
          background: "rgba(30,28,24,0.4)",
          border: "1px solid rgba(120,110,95,0.1)",
          borderBottom: "none",
        }}
      >
        <span>Contributor</span><span>ORCID</span><span>%</span><span>Role</span><span>Signature</span><span></span>
      </div>

      {/* Rows */}
      {contributors.map((c, i) => (
        <ContributorRow
          key={c.id}
          contributor={c}
          isValid={isValid}
          hasSigned={hasSigned}
          isCurrentUser={c.wallet === currentUserWallet}
          isLast={i === contributors.length - 1}
          showAddRow={showAddRow}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onSign={onSign}
        />
      ))}

      {/* Add contributor row */}
      {showAddRow ? (
        <div
          className="flex gap-2.5 py-3 px-3.5 items-center rounded-b-md"
          style={{
            border: "1px solid rgba(120,110,95,0.08)",
            borderTop: "none",
            background: "rgba(30,28,24,0.3)",
          }}
        >
          <input
            type="text"
            placeholder="Wallet address or DID..."
            value={addWallet}
            onChange={e => onSetAddWallet(e.target.value)}
            className="flex-1 py-2 px-3 rounded text-[#d4ccc0] font-mono text-xs outline-none"
            style={{ background: "rgba(30,28,24,0.6)", border: "1px solid rgba(120,110,95,0.2)" }}
          />
          <button
            onClick={onAdd}
            className="rounded py-2 px-4 text-[#d4c8a8] font-serif text-xs cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.1))",
              border: "1px solid rgba(180,160,120,0.3)",
            }}
          >Add</button>
          <button
            onClick={() => { onSetShowAddRow(false); onSetAddWallet(""); }}
            className="rounded py-2 px-3 text-[#6a6050] text-xs cursor-pointer font-serif"
            style={{ background: "none", border: "1px solid rgba(120,110,95,0.15)" }}
          >Cancel</button>
          <button
            onClick={onInvite}
            className="rounded py-2 px-3 text-[#7a9fc7] text-[11px] cursor-pointer font-serif"
            style={{ background: "none", border: "1px solid rgba(130,160,200,0.25)" }}
          >Invite Off-Platform</button>
        </div>
      ) : (
        <button
          onClick={() => onSetShowAddRow(true)}
          className="w-full py-2.5 mt-2.5 rounded text-[#6a6050] font-serif text-xs cursor-pointer transition-all duration-300"
          style={{ background: "transparent", border: "1px dashed rgba(120,110,95,0.25)" }}
        >+ Add Contributor</button>
      )}
    </div>
  );
}
