"use client";

import type { Contributor, ExistingDraft } from "@/src/features/researcher/types/contract";
import { mockTxHash } from "@/src/shared/lib/format";

interface ContractPreviewProps {
  showPreview: boolean;
  onToggle: () => void;
  title: string;
  draft: ExistingDraft | undefined;
  contributors: Contributor[];
}

export function ContractPreview({ showPreview, onToggle, title, draft, contributors }: ContractPreviewProps) {
  return (
    <div className="rounded-lg overflow-hidden mb-6" style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)" }}>
      <button
        onClick={onToggle}
        className="w-full py-4 px-6 bg-transparent border-none flex justify-between items-center cursor-pointer"
      >
        <span className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px]">Contract Preview</span>
        <span className="text-[#6a6050] text-xs">{showPreview ? "\u25B2" : "\u25BC"}</span>
      </button>

      {showPreview && (
        <div className="px-6 pb-6">
          <div className="rounded-md p-5" style={{ background: "rgba(30,28,24,0.6)", border: "1px solid rgba(120,110,95,0.1)" }}>
            <div className="text-sm text-[#e8e0d4] italic mb-4">
              {draft ? draft.title : title || "Untitled Paper"}
            </div>
            {draft && <div className="text-[10px] text-[#5a7a9a] font-mono mb-4">Paper hash: {draft.hash}</div>}

            <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-2.5">Contributors</div>
            {contributors.map((c, i) => (
              <div
                key={c.id}
                className="flex justify-between items-center py-2"
                style={{ borderBottom: i < contributors.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none" }}
              >
                <div>
                  <span className="text-[13px] text-[#d4ccc0]">{c.name}</span>
                  <span className="text-[11px] text-[#6a6050] ml-2">{c.role}</span>
                </div>
                <span className="text-[15px] text-[#c9b89e] font-sans font-semibold">{c.pct}%</span>
              </div>
            ))}

            <div
              className="mt-4 py-3 px-3.5 rounded text-[11px] text-[#8a8070] italic leading-relaxed"
              style={{ background: "rgba(120,110,95,0.06)" }}
            >
              All parties agree to the contribution split as defined above. Any modification to authorship order or contribution weights requires unanimous re-signing by all contributors. This contract is immutably recorded on Hedera.
            </div>

            <div className="mt-3.5 text-[10px] text-[#5a7a9a] font-mono">
              Contract hash: {mockTxHash()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
