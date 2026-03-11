'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import type {
  AnonymizedReview,
  ReviewerInfo,
} from '@/src/features/researcher/types/review';

interface Props {
  reviewers: ReviewerInfo[];
  reviews: AnonymizedReview[];
  allReviewsComplete: boolean;
  authorResponseStatus: string | null;
  onAccept: () => void;
  submitting: boolean;
}

export function ReviewsStatusSection({
  reviewers,
  reviews,
  allReviewsComplete,
  authorResponseStatus,
  onAccept,
  submitting,
}: Props) {
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  return (
    <div className="mb-6">
      <h3 className="text-[14px] font-serif text-[#c9a44a] mb-3">
        Reviews Status
      </h3>

      {reviewers.length === 0 ? (
        <p className="text-[12px] text-[#6a6050]">No reviewers assigned yet.</p>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {reviewers.map((reviewer) => {
            const review = reviews.find((r) => r.label === reviewer.label);
            const isExpanded = expandedReview === reviewer.assignmentId;

            return (
              <div key={reviewer.assignmentId}>
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-md"
                  style={{
                    background: 'rgba(30,28,25,0.4)',
                    border: '1px solid rgba(120,110,95,0.1)',
                  }}
                >
                  <span className="text-[13px] text-[#b0a898]">
                    {reviewer.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded"
                      style={{
                        background:
                          reviewer.status === 'complete'
                            ? 'rgba(143,188,143,0.15)'
                            : 'rgba(201,164,74,0.1)',
                        color:
                          reviewer.status === 'complete'
                            ? '#8fbc8f'
                            : '#c9a44a',
                      }}
                    >
                      {reviewer.status === 'complete'
                        ? 'Complete'
                        : 'In Progress'}
                    </span>
                    {reviewer.status === 'complete' && review && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedReview(
                            isExpanded ? null : reviewer.assignmentId,
                          )
                        }
                        className="flex items-center gap-1 text-[11px] text-[#5a7a9a] cursor-pointer"
                      >
                        <Eye size={12} />
                        {isExpanded ? 'Hide' : 'See comment'}
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && review && (
                  <div
                    className="mt-1 px-4 py-3 rounded-md text-[12px]"
                    style={{
                      background: 'rgba(30,28,25,0.6)',
                      border: '1px solid rgba(120,110,95,0.08)',
                    }}
                  >
                    {review.strengths && (
                      <div className="mb-2">
                        <span className="text-[10px] text-[#6a6050] uppercase tracking-wider">
                          Strengths
                        </span>
                        <p className="text-[#b0a898] mt-0.5">
                          {review.strengths}
                        </p>
                      </div>
                    )}
                    {review.weaknesses && (
                      <div className="mb-2">
                        <span className="text-[10px] text-[#6a6050] uppercase tracking-wider">
                          Weaknesses
                        </span>
                        <p className="text-[#b0a898] mt-0.5">
                          {review.weaknesses}
                        </p>
                      </div>
                    )}
                    {review.questionsForAuthors && (
                      <div className="mb-2">
                        <span className="text-[10px] text-[#6a6050] uppercase tracking-wider">
                          Questions
                        </span>
                        <p className="text-[#b0a898] mt-0.5">
                          {review.questionsForAuthors}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] text-[#6a6050] uppercase tracking-wider">
                        Recommendation
                      </span>
                      <p className="text-[#b0a898] mt-0.5">
                        {review.recommendation ?? '\u2014'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {allReviewsComplete && !authorResponseStatus && (
        <div className="flex items-center gap-3">
          <p className="text-[12px] text-[#8a8070] flex-1">
            All reviews are complete. Accept the reviews to forward them to the
            editor for a final decision.
          </p>
          <button
            type="button"
            onClick={onAccept}
            disabled={submitting}
            className="px-5 py-2 rounded-md text-[12px] font-medium cursor-pointer shrink-0"
            style={{
              background: 'rgba(143,188,143,0.2)',
              color: '#8fbc8f',
              border: '1px solid rgba(143,188,143,0.3)',
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Accept Reviews'}
          </button>
        </div>
      )}
    </div>
  );
}
