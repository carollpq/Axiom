"use client";

import type { SignedContract, RegisteredJournal } from "@/src/features/author/types/paper-registration";
import { HashDisplay } from "./HashDisplay";

interface RegisterSubmitStepProps {
  title: string;
  fileHash: string;
  datasetHash: string;
  codeCommit: string;
  envHash: string;
  visibility: string;
  contract: SignedContract | undefined;
  journals: RegisteredJournal[];
  selectedJournal: string | null;
  accessPrice: string;
  onSelectJournal: (id: string | null) => void;
  onAccessPriceChange: (v: string) => void;
  onRegister: () => void;
  onSubmit: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "rgba(30,28,24,0.8)",
  border: "1px solid rgba(120,110,95,0.25)", borderRadius: 4,
  color: "#d4ccc0", fontFamily: "'Georgia', serif", fontSize: 13, outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = { fontSize: 10, color: "#8a8070", marginBottom: 6, display: "block" };

export function RegisterSubmitStep({
  title, fileHash, datasetHash, codeCommit, envHash, visibility,
  contract, journals, selectedJournal, accessPrice, onSelectJournal, onAccessPriceChange, onRegister, onSubmit,
}: RegisterSubmitStepProps) {
  const canSubmit = !!(contract && selectedJournal);

  return (
    <div>
      {/* Summary */}
      <div
        className="rounded-lg p-6 mb-5"
        style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.2)" }}
      >
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-4">Submission Summary</div>
        <div className="text-sm text-[#e8e0d4] italic mb-4">{title || "Untitled"}</div>
        <HashDisplay label="Paper" hash={fileHash} />
        <HashDisplay label="Dataset" hash={datasetHash} />
        <HashDisplay label="Code Commit" hash={codeCommit} />
        <HashDisplay label="Environment" hash={envHash} />
        <HashDisplay label="Contract" hash={contract ? contract.hash.replace("0x", "") + "0000" : ""} />
        <div className="mt-3 flex gap-2">
          <span
            className="text-[10px] py-0.5 px-2.5 rounded-sm"
            style={{
              background: visibility === "private" ? "rgba(150,150,170,0.12)" : "rgba(120,180,120,0.12)",
              border: "1px solid " + (visibility === "private" ? "rgba(150,150,170,0.2)" : "rgba(120,180,120,0.2)"),
              color: visibility === "private" ? "#9a9aad" : "#8fbc8f",
            }}
          >
            {visibility === "private" ? "Private Draft" : "Public Draft"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        {/* Register */}
        <div
          className="flex-1 p-6 rounded-lg text-center"
          style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(180,160,120,0.25)" }}
        >
          <div className="text-sm text-[#d4c8a8] mb-1.5">Register Draft</div>
          <div className="text-[11px] text-[#6a6050] mb-4 leading-relaxed">
            Timestamp your paper on Hedera. Records paper hash, author DID, ORCID, and provenance hashes. Always available.
          </div>
          <div className="mb-4 text-left">
            <label style={labelStyle}>Access price (USD) — set 0 for free/open access</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={accessPrice}
              onChange={e => onAccessPriceChange(e.target.value)}
              style={{ ...inputStyle, maxWidth: 120, textAlign: "right" }}
            />
          </div>
          <button
            onClick={onRegister}
            className="py-3 px-7 rounded text-[#d4c8a8] font-serif text-sm cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))",
              border: "1px solid rgba(180,160,120,0.4)",
            }}
          >Register on Hedera</button>
        </div>

        {/* Submit */}
        <div
          className="flex-1 p-6 rounded-lg text-center"
          style={{
            background: contract ? "rgba(120,180,120,0.04)" : "rgba(45,42,38,0.3)",
            border: "1px solid " + (contract ? "rgba(120,180,120,0.2)" : "rgba(120,110,95,0.15)"),
            opacity: contract ? 1 : 0.6,
          }}
        >
          <div className="text-sm mb-1.5" style={{ color: contract ? "#8fbc8f" : "#4a4238" }}>Submit to Journal</div>
          <div className="text-[11px] text-[#6a6050] leading-relaxed" style={{ marginBottom: contract ? 12 : 16 }}>
            {contract ? "Submit your registered paper for peer review." : "Requires a fully signed authorship contract."}
          </div>
          {contract && (
            <div className="mb-3">
              <label style={labelStyle}>Select Journal</label>
              <select
                value={selectedJournal || ""}
                onChange={e => onSelectJournal(e.target.value || null)}
                style={{ ...inputStyle, appearance: "none", cursor: "pointer", textAlign: "center", maxWidth: 280, margin: "0 auto" }}
              >
                <option value="">-- Choose journal --</option>
                {journals.map(j => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={canSubmit ? onSubmit : undefined}
            disabled={!canSubmit}
            className="py-3 px-7 rounded font-serif text-sm"
            style={{
              background: canSubmit ? "linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))" : "rgba(120,110,95,0.1)",
              border: "1px solid " + (canSubmit ? "rgba(120,180,120,0.4)" : "rgba(120,110,95,0.15)"),
              color: canSubmit ? "#8fbc8f" : "#4a4238",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
          >Submit for Review</button>
        </div>
      </div>
    </div>
  );
}
