"use client";

import type { CompletedReview } from "@/src/features/reviewer/types";
import { Stars } from "./Stars";

interface CompletedReviewsTableProps {
  reviews: CompletedReview[];
  hoveredRow: number | null;
  onHoverRow: (id: number | null) => void;
}

export function CompletedReviewsTable({ reviews, hoveredRow, onHoverRow }: CompletedReviewsTableProps) {
  return (
    <div className="rounded-md overflow-hidden" style={{ border: "1px solid rgba(120,110,95,0.15)" }}>
      {/* Header */}
      <div
        className="px-5 py-3 text-[10px] text-[#6a6050] uppercase tracking-[1.5px]"
        style={{
          display: "grid",
          gridTemplateColumns: "2.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.7fr",
          background: "rgba(45,42,38,0.5)",
          borderBottom: "1px solid rgba(120,110,95,0.15)",
        }}
      >
        <span>Paper</span>
        <span>Journal</span>
        <span>Submitted</span>
        <span>Editor</span>
        <span>Author</span>
        <span>On-Chain</span>
      </div>

      {/* Empty state */}
      {reviews.length === 0 && (
        <div
          className="px-5 py-10 text-center font-serif text-sm"
          style={{ color: "#6a6050" }}
        >
          No completed reviews yet.
        </div>
      )}

      {/* Rows */}
      {reviews.map((r, i) => (
        <div
          key={r.id}
          onMouseEnter={() => onHoverRow(r.id)}
          onMouseLeave={() => onHoverRow(null)}
          className="items-center px-5 py-3.5 cursor-pointer transition-colors duration-200"
          style={{
            display: "grid",
            gridTemplateColumns: "2.5fr 0.8fr 0.8fr 0.8fr 0.8fr 0.7fr",
            background: hoveredRow === r.id ? "rgba(120,110,95,0.08)" : "transparent",
            borderBottom: i < reviews.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none",
          }}
        >
          <span className="text-[13px] text-[#d4ccc0] leading-[1.4] pr-4">{r.title}</span>
          <span className="text-xs text-[#8a8070]">{r.journal}</span>
          <span className="text-xs text-[#6a6050]">{r.submitted}</span>
          <span><Stars rating={r.editorRating} /></span>
          <span><Stars rating={r.authorRating} /></span>
          <span className="text-[11px] text-[#5a7a9a] font-mono">{r.hash}</span>
        </div>
      ))}
    </div>
  );
}
