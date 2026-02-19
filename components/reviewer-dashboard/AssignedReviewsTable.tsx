"use client";

import type { AssignedReview } from "@/types/reviewer-dashboard";
import { StatusBadge } from "./StatusBadge";

interface AssignedReviewsTableProps {
  reviews: AssignedReview[];
  hoveredRow: number | null;
  onHoverRow: (id: number | null) => void;
  getUrgencyStyle: (daysLeft: number, status: string) => { color: string; bg: string; border: string };
}

export function AssignedReviewsTable({ reviews, hoveredRow, onHoverRow, getUrgencyStyle }: AssignedReviewsTableProps) {
  return (
    <div className="rounded-md overflow-hidden" style={{ border: "1px solid rgba(120,110,95,0.15)" }}>
      {/* Header */}
      <div
        className="px-5 py-3 text-[10px] text-[#6a6050] uppercase tracking-[1.5px]"
        style={{
          display: "grid",
          gridTemplateColumns: "2.5fr 1fr 0.8fr 0.8fr 0.8fr",
          background: "rgba(45,42,38,0.5)",
          borderBottom: "1px solid rgba(120,110,95,0.15)",
        }}
      >
        <span>Paper</span>
        <span>Journal</span>
        <span>Deadline</span>
        <span>Time Left</span>
        <span>Status</span>
      </div>

      {/* Rows */}
      {reviews.map((r, i) => {
        const u = getUrgencyStyle(r.daysLeft, r.status);
        return (
          <div
            key={r.id}
            onMouseEnter={() => onHoverRow(r.id)}
            onMouseLeave={() => onHoverRow(null)}
            className="items-center px-5 py-3.5 cursor-pointer transition-colors duration-200"
            style={{
              display: "grid",
              gridTemplateColumns: "2.5fr 1fr 0.8fr 0.8fr 0.8fr",
              background: hoveredRow === r.id ? "rgba(120,110,95,0.08)" : "transparent",
              borderBottom: i < reviews.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none",
              borderLeft:
                r.status === "Late"
                  ? "3px solid #d4645a"
                  : r.daysLeft <= 3
                    ? "3px solid #d4a45a"
                    : "3px solid transparent",
            }}
          >
            <span className="text-[13px] text-[#d4ccc0] leading-[1.4] pr-4">{r.title}</span>
            <span className="text-xs text-[#8a8070]">{r.journal}</span>
            <span className="text-xs text-[#6a6050]">{r.deadline}</span>
            <span
              className="text-xs"
              style={{ color: u.color, fontWeight: r.status === "Late" ? 600 : 400 }}
            >
              {r.status === "Late" ? `${Math.abs(r.daysLeft)}d overdue` : `${r.daysLeft}d`}
            </span>
            <span>
              <StatusBadge status={r.status} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
