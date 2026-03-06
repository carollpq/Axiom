"use client";

import { Button } from "@/src/shared/components/Button";
import { FormTextarea } from "@/src/shared/components/FormTextarea";
import { FormSelect } from "@/src/shared/components/FormSelect";
import { SidebarSection } from "@/src/shared/components/SidebarSection";
import type { AuthorResponseStatusDb } from "@/src/shared/lib/db/schema";

const authorStatusLabels: Record<AuthorResponseStatusDb, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pending", color: "#9a9aad", bg: "rgba(150,150,170,0.15)", border: "rgba(150,150,170,0.3)" },
  accepted: { label: "Accepted Reviews", color: "#8fbc8f", bg: "rgba(120,180,120,0.15)", border: "rgba(120,180,120,0.3)" },
  rebuttal_requested: { label: "Rebuttal Requested", color: "#c9a44a", bg: "rgba(180,160,120,0.15)", border: "rgba(180,160,120,0.3)" },
};

interface FinalDecisionPanelProps {
  comment: string;
  onCommentChange: (v: string) => void;
  decision: string;
  onDecisionChange: (v: string) => void;
  onRelease: () => void;
  allReviewsComplete?: boolean;
  authorResponseStatus: AuthorResponseStatusDb | null;
  canMakeDecision: boolean;
  isLoading?: boolean;
}

export function FinalDecisionPanel({
  comment,
  onCommentChange,
  decision,
  onDecisionChange,
  onRelease,
  allReviewsComplete,
  authorResponseStatus,
  canMakeDecision,
  isLoading = false,
}: FinalDecisionPanelProps) {
  const statusInfo = authorStatusLabels[authorResponseStatus ?? "pending"];

  return (
    <SidebarSection title="Editorial Decision">
      {/* Author Status */}
      {allReviewsComplete && (
        <div className="mb-3">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-1.5">
            Author Status
          </div>
          <div
            className="text-[11px] px-3 py-1.5 rounded inline-block font-serif"
            style={{
              background: statusInfo.bg,
              border: `1px solid ${statusInfo.border}`,
              color: statusInfo.color,
            }}
          >
            {statusInfo.label}
          </div>
          {!canMakeDecision && (
            <p className="text-[10px] text-[#6a6050] mt-1.5 italic">
              Waiting for author to respond to reviews before final decision can be made.
            </p>
          )}
        </div>
      )}

      <FormTextarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Add your comment..."
        rows={3}
        className="mb-3"
        disabled={isLoading}
      />

      <div className="flex items-center gap-2 min-w-0">
        <FormSelect
          value={decision}
          onChange={(e) => onDecisionChange(e.target.value)}
          className="flex-1 min-w-0"
          disabled={!canMakeDecision || isLoading}
        >
          <option value="">Final Decision</option>
          <option value="accept">Accept</option>
          <option value="reject">Reject</option>
          <option value="revise">Request Revision</option>
        </FormSelect>

        <Button
          variant="gold"
          onClick={onRelease}
          className="shrink-0"
          disabled={!canMakeDecision || !decision || isLoading}
        >
          {isLoading ? "Releasing..." : "Release"}
        </Button>
      </div>
    </SidebarSection>
  );
}
