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
import type { ReviewerWithStatus } from '@/src/features/editor/types';

interface DecisionReadyPanelProps {
  comment: string;
  onCommentChange: (v: string) => void;
  decision: string;
  onDecisionChange: (v: string) => void;
  onRelease: () => void;
  isLoading?: boolean;
  authorResponseStatus: AuthorResponseStatusDb | null;
  reviewers?: ReviewerWithStatus[];
  reviewerRatings?: Record<string, number>;
  onReviewerRatingChange?: (assignmentId: string, rating: number) => void;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

export function DecisionReadyPanel({
  comment,
  onCommentChange,
  decision,
  onDecisionChange,
  onRelease,
  isLoading = false,
  authorResponseStatus,
  reviewers,
  reviewerRatings,
  onReviewerRatingChange,
}: DecisionReadyPanelProps) {
  const label = authorStatusLabels[authorResponseStatus ?? 'pending'];
  const statusInfo = getStatusColors(label);

  const completedReviewers = reviewers?.filter((r) => r.status === 'complete');

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

      {completedReviewers && completedReviewers.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-2">
            Rate Reviewers
          </div>
          <div className="space-y-2">
            {completedReviewers.map((reviewer) => (
              <div
                key={reviewer.id}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-[12px] text-[#b0a898] truncate font-serif">
                  {reviewer.name}
                </span>
                <div className="flex gap-0.5 shrink-0">
                  {RATING_OPTIONS.map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        onReviewerRatingChange?.(reviewer.id, star)
                      }
                      disabled={isLoading}
                      className="text-[14px] transition-colors"
                      style={{
                        color:
                          (reviewerRatings?.[reviewer.id] ?? 0) >= star
                            ? '#c9a44a'
                            : '#3a3530',
                      }}
                    >
                      &#9733;
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
