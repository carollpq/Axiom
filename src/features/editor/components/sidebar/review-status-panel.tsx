'use client';

import { useState } from 'react';
import type { ReviewerWithStatus } from '@/src/features/editor/types';
import {
  getStatusColors,
  reviewAssignmentLabels,
} from '@/src/shared/lib/status-colors';
import { FORM_CONTROL_STYLE } from '@/src/shared/components/form-styles';
import { ReviewContentBlock } from '@/src/shared/components/review-content-block';
import { SidebarSection } from '@/src/shared/components/sidebar-section';
import { ListRow } from '@/src/shared/components/list-row';

interface ReviewStatusPanelProps {
  reviewers: ReviewerWithStatus[];
}

export function ReviewStatusPanel({ reviewers }: ReviewStatusPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <SidebarSection title="Review Status">
      <div className="space-y-2">
        {reviewers.map((r) => {
          const label = reviewAssignmentLabels[r.status];
          const c = getStatusColors(label);
          return (
            <div key={r.id}>
              <ListRow>
                <span className="text-[12px] text-[#d4ccc0] font-serif truncate min-w-0">
                  {r.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-sm"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.text,
                    }}
                  >
                    {label}
                  </span>
                  {r.hasComment && (
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === r.id ? null : r.id)
                      }
                      className="text-[10px] text-[#8a8070] hover:text-[#c9b89e] cursor-pointer"
                    >
                      {expandedId === r.id ? 'Hide' : 'See comment...'}
                    </button>
                  )}
                </div>
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
          );
        })}
      </div>
    </SidebarSection>
  );
}
