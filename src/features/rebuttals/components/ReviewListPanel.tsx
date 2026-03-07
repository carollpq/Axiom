"use client";

import { SectionLabel } from "@/src/shared/components/SectionLabel";

interface ReviewListItem {
  id: string;
  anonymousLabel: string;
}

interface ReviewResponse {
  position?: string;
  justification?: string;
}

interface ReviewListPanelProps {
  reviews: ReviewListItem[];
  responses: Record<string, ReviewResponse>;
  selectedReviewId: string | null;
  onSelect: (id: string) => void;
  deadline: string;
}

export function ReviewListPanel({
  reviews,
  responses,
  selectedReviewId,
  onSelect,
  deadline,
}: ReviewListPanelProps) {
  const deadlineDate = new Date(deadline);
  const isPastDeadline = deadlineDate < new Date();

  return (
    <div
      className="w-[220px] shrink-0 overflow-y-auto"
      style={{
        borderRight: "1px solid rgba(120,110,95,0.15)",
        background: "rgba(30,28,24,0.3)",
      }}
    >
      <div className="p-4">
        <SectionLabel className="mb-3">Reviews to Address</SectionLabel>
        <div className="space-y-1">
          {reviews.map((r) => {
            const resp = responses[r.id];
            const hasResponse = resp?.justification?.trim();
            return (
              <button
                key={r.id}
                onClick={() => onSelect(r.id)}
                className="w-full text-left px-3 py-2.5 rounded cursor-pointer transition-colors"
                style={{
                  background:
                    selectedReviewId === r.id
                      ? "rgba(201,164,74,0.1)"
                      : "transparent",
                  border:
                    selectedReviewId === r.id
                      ? "1px solid rgba(201,164,74,0.3)"
                      : "1px solid transparent",
                }}
              >
                <div className="text-[12px] text-[#d4ccc0] font-serif">
                  {r.anonymousLabel}
                </div>
                <div className="text-[10px] text-[#6a6050] mt-0.5">
                  {hasResponse
                    ? resp.position === "agree"
                      ? "Agrees"
                      : "Disagrees"
                    : "No response yet"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Deadline info */}
      <div
        className="p-4"
        style={{ borderTop: "1px solid rgba(120,110,95,0.1)" }}
      >
        <SectionLabel className="mb-1">Deadline</SectionLabel>
        <div
          className="text-[12px] font-serif"
          style={{ color: isPastDeadline ? "#d4645a" : "#b0a898" }}
        >
          {deadlineDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          {isPastDeadline && " (expired)"}
        </div>
      </div>
    </div>
  );
}
