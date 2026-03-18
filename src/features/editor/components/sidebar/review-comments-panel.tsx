'use client';

import { useState } from 'react';
import { FORM_CONTROL_STYLE } from '@/src/shared/components/form-styles';
import { ReviewContentBlock } from '@/src/shared/components/review-content-block';
import type { ReviewerWithStatus } from '@/src/features/editor/types';
import { SidebarSection } from '@/src/shared/components/sidebar-section';
import { ListRow } from '@/src/shared/components/list-row';

interface ReviewCommentsPanelProps {
  reviewers: ReviewerWithStatus[];
}

export function ReviewCommentsPanel({ reviewers }: ReviewCommentsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <SidebarSection title="Reviews">
      {reviewers.length === 0 ? (
        <p className="text-[13px] text-[#6a6050] italic px-1 py-2">
          No reviews submitted yet.
        </p>
      ) : (
        <div className="space-y-2">
          {reviewers.map((r) => (
            <div key={r.id}>
              <ListRow variant="gold">
                <span className="text-[12px] text-[#d4ccc0] font-serif truncate min-w-0">
                  {r.name}
                </span>
                {r.hasComment && (
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === r.id ? null : r.id)
                    }
                    className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer shrink-0"
                    style={{
                      background: 'rgba(180,160,120,0.15)',
                      border: '1px solid rgba(180,160,120,0.3)',
                      color: '#c9a44a',
                    }}
                  >
                    {expandedId === r.id ? 'Hide' : 'See comment...'}
                  </button>
                )}
              </ListRow>
              {expandedId === r.id && r.reviewContent && (
                <div
                  className="mt-1 rounded px-3 py-2.5 space-y-2"
                  style={FORM_CONTROL_STYLE}
                >
                  <ReviewContentBlock content={r.reviewContent} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SidebarSection>
  );
}
