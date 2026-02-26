"use client";

import type { AssignedReview } from "@/src/shared/types/reviewer-dashboard";
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
          gridTemplateColumns: "2.5fr 1fr 0.8fr 0.8fr 0.8fr 0.7fr",
          background: "rgba(45,42,38,0.5)",
          borderBottom: "1px solid rgba(120,110,95,0.15)",
        }}
      >
        <span>Paper</span>
        <span>Journal</span>
        <span>Deadline</span>
        <span>Time Left</span>
        <span>Status</span>
        <span></span>
      </div>

      {/* Rows */}
      {reviews.map((r, i) => {
        const u = getUrgencyStyle(r.daysLeft, r.status);
        const reviewUrl = `/reviewer/review_workspace/${r.assignmentId ?? r.id}`;
        return (
          <div
            key={r.id}
            onMouseEnter={() => onHoverRow(r.id)}
            onMouseLeave={() => onHoverRow(null)}
            className="items-center px-5 py-3.5 transition-colors duration-200"
            style={{
              display: "grid",
              gridTemplateColumns: "2.5fr 1fr 0.8fr 0.8fr 0.8fr 0.7fr",
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
            <span>
              {r.status !== "Submitted" && (
                <a
                  href={reviewUrl}
                  className="text-[11px] px-2.5 py-1 rounded font-serif"
                  style={{
                    background: "linear-gradient(135deg, rgba(180,160,120,0.2), rgba(160,140,100,0.12))",
                    border: "1px solid rgba(180,160,120,0.35)",
                    color: "#d4c8a8",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  {r.status === "Pending" ? "Open" : "Continue"}
                </a>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
