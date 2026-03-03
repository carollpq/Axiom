"use client";

import { Button } from "@/src/shared/components/Button";
import { FormTextarea } from "@/src/shared/components/FormTextarea";
import { FormSelect } from "@/src/shared/components/FormSelect";
import { SidebarSection } from "@/src/shared/components/SidebarSection";

interface FinalDecisionPanelProps {
  comment: string;
  onCommentChange: (v: string) => void;
  decision: string;
  onDecisionChange: (v: string) => void;
  onRelease: () => void;
  allReviewsComplete?: boolean;
  hasRebuttal?: boolean;
  onOpenRebuttal?: () => void;
  isOpeningRebuttal?: boolean;
}

export function FinalDecisionPanel({
  comment,
  onCommentChange,
  decision,
  onDecisionChange,
  onRelease,
  allReviewsComplete,
  hasRebuttal,
  onOpenRebuttal,
  isOpeningRebuttal,
}: FinalDecisionPanelProps) {
  return (
    <SidebarSection title="Editorial Decision">
      <FormTextarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Add your comment..."
        rows={3}
        className="mb-3"
      />

      <div className="flex items-center gap-2">
        <FormSelect
          value={decision}
          onChange={(e) => onDecisionChange(e.target.value)}
          className="flex-1"
        >
          <option value="">Final Decision</option>
          <option value="accept">Accept</option>
          <option value="reject">Reject</option>
          <option value="revise">Request Revision</option>
        </FormSelect>

        <Button variant="gold" onClick={onRelease} className="whitespace-nowrap">
          Release to Author
        </Button>
      </div>

      {allReviewsComplete && !hasRebuttal && onOpenRebuttal && (
        <Button
          variant="blue"
          fullWidth
          onClick={onOpenRebuttal}
          disabled={isOpeningRebuttal}
          className="mt-3"
        >
          {isOpeningRebuttal ? "Opening..." : "Open Rebuttal Phase"}
        </Button>
      )}
    </SidebarSection>
  );
}
