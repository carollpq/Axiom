'use client';

import { Button } from '@/src/shared/components/button.client';
import { FormTextarea } from '@/src/shared/components/form-textarea.client';
import { FormSelect } from '@/src/shared/components/form-select.client';
import { SidebarSection } from '@/src/shared/components/sidebar-section';
import {
  getStatusColors,
  authorStatusLabels,
} from '@/src/shared/lib/status-colors';
import type { AuthorResponseStatusDb } from '@/src/shared/lib/db/schema';

interface DecisionReadyPanelProps {
  comment: string;
  onCommentChange: (v: string) => void;
  decision: string;
  onDecisionChange: (v: string) => void;
  onRelease: () => void;
  isLoading?: boolean;
  authorResponseStatus: AuthorResponseStatusDb | null;
}

export function DecisionReadyPanel({
  comment,
  onCommentChange,
  decision,
  onDecisionChange,
  onRelease,
  isLoading = false,
  authorResponseStatus,
}: DecisionReadyPanelProps) {
  const label = authorStatusLabels[authorResponseStatus ?? 'pending'];
  const statusInfo = getStatusColors(label);

  return (
    <SidebarSection title="Editorial Decision">
      <div className="mb-3">
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-1.5">
          Author Status
        </div>
        <div
          className="text-[11px] px-3 py-1.5 rounded inline-block font-serif"
          style={{
            background: statusInfo.bg,
            border: `1px solid ${statusInfo.border}`,
            color: statusInfo.text,
          }}
        >
          {label}
        </div>
      </div>

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
          disabled={isLoading}
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
          disabled={!decision || isLoading}
        >
          {isLoading ? 'Releasing...' : 'Release'}
        </Button>
      </div>
    </SidebarSection>
  );
}
