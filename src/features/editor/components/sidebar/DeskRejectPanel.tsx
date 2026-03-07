"use client";

import { Button } from "@/src/shared/components/Button";
import { FormTextarea } from "@/src/shared/components/FormTextarea";
import { SectionLabel } from "@/src/shared/components/SectionLabel";

interface DeskRejectPanelProps {
  comment: string;
  onCommentChange: (v: string) => void;
  onSend: () => void;
  isLoading?: boolean;
}

export function DeskRejectPanel({
  comment,
  onCommentChange,
  onSend,
  isLoading = false,
}: DeskRejectPanelProps) {
  return (
    <div className="p-4">
      <SectionLabel className="mb-3">Desk Reject</SectionLabel>

      <FormTextarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Add comment..."
        rows={4}
        disabled={isLoading}
      />

      <div className="flex justify-end mt-2">
        <Button variant="red" onClick={onSend} className="px-5" disabled={isLoading}>
          {isLoading ? "Rejecting..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
