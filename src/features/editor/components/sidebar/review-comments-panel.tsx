'use client';

import { useState } from 'react';
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
                  style={{
                    background: 'rgba(30,28,24,0.6)',
                    border: '1px solid rgba(120,110,95,0.15)',
                  }}
                >
                  {r.reviewContent.strengths && (
                    <div>
                      <div className="text-[9px] text-[#6a6050] uppercase tracking-[1px] mb-0.5">
                        Strengths
                      </div>
                      <p className="text-[11px] text-[#b0a898] leading-relaxed">
                        {r.reviewContent.strengths}
                      </p>
                    </div>
                  )}
                  {r.reviewContent.weaknesses && (
                    <div>
                      <div className="text-[9px] text-[#6a6050] uppercase tracking-[1px] mb-0.5">
                        Weaknesses
                      </div>
                      <p className="text-[11px] text-[#b0a898] leading-relaxed">
                        {r.reviewContent.weaknesses}
                      </p>
                    </div>
                  )}
                  {r.reviewContent.recommendation && (
                    <div>
                      <div className="text-[9px] text-[#6a6050] uppercase tracking-[1px] mb-0.5">
                        Recommendation
                      </div>
                      <p className="text-[11px] text-[#b0a898] leading-relaxed">
                        {r.reviewContent.recommendation}
                      </p>
                    </div>
                  )}
                  {!r.reviewContent.strengths &&
                    !r.reviewContent.weaknesses &&
                    !r.reviewContent.recommendation && (
                      <p className="text-[11px] text-[#6a6050] italic">
                        No detailed comments available.
                      </p>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SidebarSection>
  );
}
