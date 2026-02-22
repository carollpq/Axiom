"use client";

import type { Contributor } from "@/types/contract";

interface ContributorRowProps {
  contributor: Contributor;
  isValid: boolean;
  hasSigned: boolean;
  isCurrentUser: boolean;
  isLast: boolean;
  showAddRow: boolean;
  onUpdate: (id: number, field: string, value: string | number) => void;
  onRemove: (id: number) => void | Promise<void>;
  onSign: (id: number) => void | Promise<void>;
}

export function ContributorRow({ contributor: c, isValid, hasSigned, isCurrentUser, isLast, showAddRow, onUpdate, onRemove, onSign }: ContributorRowProps) {
  return (
    <div
      className="grid items-center gap-2 py-3 px-3.5"
      style={{
        gridTemplateColumns: "1.8fr 0.8fr 0.5fr 1.2fr 0.8fr 0.3fr",
        background: c.status === "signed" ? "rgba(120,180,120,0.03)" : "transparent",
        border: "1px solid rgba(120,110,95,0.08)",
        borderTop: "none",
        borderRadius: isLast && !showAddRow ? "0 0 6px 6px" : "0",
      }}
    >
      {/* Name + wallet */}
      <div>
        <div className="text-[13px] text-[#d4ccc0] flex items-center gap-1.5">
          {c.name}
          {c.isCreator && (
            <span className="text-[9px] text-[#c9b89e] px-1.5 py-px rounded-sm" style={{ background: "rgba(180,160,120,0.15)" }}>
              Creator
            </span>
          )}
        </div>
        <div className="text-[10px] text-[#5a7a9a] font-mono mt-0.5">{c.wallet}</div>
      </div>

      {/* ORCID */}
      <div className="text-[11px]" style={{ color: c.orcid === "\u2014" ? "#4a4238" : "#8a8070" }}>{c.orcid}</div>

      {/* Percentage */}
      <input
        type="number" min="0" max="100" value={c.pct}
        onChange={e => onUpdate(c.id, "pct", e.target.value)}
        className="w-full py-1.5 px-2 rounded-sm text-[#d4ccc0] font-sans text-[13px] outline-none text-center box-border"
        style={{ background: "rgba(30,28,24,0.6)", border: "1px solid rgba(120,110,95,0.2)" }}
      />

      {/* Role */}
      <input
        type="text" placeholder="Describe role..." value={c.role}
        onChange={e => onUpdate(c.id, "role", e.target.value)}
        className="w-full py-1.5 px-2 rounded-sm text-[#b0a898] font-serif text-[11px] outline-none box-border"
        style={{ background: "rgba(30,28,24,0.6)", border: "1px solid rgba(120,110,95,0.2)" }}
      />

      {/* Signature status */}
      <div>
        {c.status === "signed" ? (
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[#8fbc8f] text-[13px]">{"\u2713"}</span>
              <span className="text-[11px] text-[#8fbc8f]">Signed</span>
            </div>
            <div className="text-[9px] text-[#5a7a9a] font-mono mt-0.5">{c.txHash}</div>
          </div>
        ) : c.status === "declined" ? (
          <div className="flex items-center gap-1">
            <span className="text-[#d4645a] text-[13px]">{"\u2715"}</span>
            <span className="text-[11px] text-[#d4645a]">Declined</span>
          </div>
        ) : (
          <div>
            {isCurrentUser ? (
              <button
                onClick={() => onSign(c.id)}
                disabled={!isValid}
                className="rounded-sm py-1 px-3 text-[11px] font-serif"
                style={{
                  background: isValid ? "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))" : "rgba(120,110,95,0.1)",
                  border: "1px solid " + (isValid ? "rgba(180,160,120,0.4)" : "rgba(120,110,95,0.15)"),
                  color: isValid ? "#d4c8a8" : "#4a4238",
                  cursor: isValid ? "pointer" : "not-allowed",
                }}
              >Sign</button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#c4956a]">Pending</span>
                <button
                  className="rounded-sm py-0.5 px-2 text-[9px] text-[#6a6050] font-serif cursor-pointer"
                  style={{ background: "none", border: "1px solid rgba(120,110,95,0.2)" }}
                >Remind</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remove button */}
      <div>
        {!c.isCreator && !hasSigned && (
          <button
            onClick={() => onRemove(c.id)}
            className="bg-transparent border-none text-[#4a4238] text-base cursor-pointer p-0 leading-none"
          >{"\u2715"}</button>
        )}
      </div>
    </div>
  );
}
