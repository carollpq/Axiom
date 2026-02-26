"use client";

import type { Recommendation } from "@/src/shared/types/review-workspace";

interface RecommendationSectionProps {
  recommendation: Recommendation | null;
  allCriteriaMet: boolean;
  onChange: (value: Recommendation) => void;
}

const OPTIONS: Recommendation[] = ["Accept", "Minor Revisions", "Major Revisions", "Reject"];

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(30,28,24,0.8)",
  border: "1px solid rgba(120,110,95,0.25)",
  borderRadius: 4,
  color: "#d4ccc0",
  fontFamily: "'Georgia', serif",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  appearance: "none",
  cursor: "pointer",
};

export function RecommendationSection({
  recommendation,
  allCriteriaMet,
  onChange,
}: RecommendationSectionProps) {
  return (
    <div className="mb-6">
      <h3
        className="text-base font-serif font-normal m-0 mb-4"
        style={{ color: "#e8e0d4" }}
      >
        Recommendation
      </h3>

      {allCriteriaMet && (
        <div
          className="rounded-md px-5 py-3 mb-4 text-xs"
          style={{
            background: "rgba(143,188,143,0.1)",
            border: "1px solid rgba(143,188,143,0.3)",
            color: "#8fbc8f",
          }}
        >
          All journal criteria are met. Any rejection must be accompanied by a
          public on-chain justification from the editor.
        </div>
      )}

      <div className="relative">
        <select
          value={recommendation ?? ""}
          onChange={e => onChange(e.target.value as Recommendation)}
          style={selectStyle}
        >
          <option value="" disabled>
            Select your recommendation...
          </option>
          {OPTIONS.map(o => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none"
          style={{ color: "#6a6050" }}
        >
          {"\u25BC"}
        </span>
      </div>
    </div>
  );
}
