'use client';

import { useState } from 'react';
import type {
  AnonymizedReview,
  ProtocolRatings,
} from '@/src/features/researcher/types/review';
import {
  PROTOCOL_FULL_LABELS,
  DEFAULT_RATINGS,
} from '@/src/features/researcher/config/review';
import { RatedBadge } from '@/src/shared/components/rated-badge';

interface Props {
  reviews: AnonymizedReview[];
  ratedReviewIds?: string[];
  onRate: (
    reviewId: string,
    ratings: Record<string, number>,
    comment: string,
  ) => Promise<void>;
}

export function ReviewerFeedbackSection({
  reviews,
  ratedReviewIds = [],
  onRate,
}: Props) {
  const [selectedReviewId, setSelectedReviewId] = useState(
    reviews[0]?.id ?? '',
  );

  // Per-reviewer ratings and comments
  const [ratingsMap, setRatingsMap] = useState<Record<string, ProtocolRatings>>(
    () =>
      Object.fromEntries(reviews.map((r) => [r.id, { ...DEFAULT_RATINGS }])),
  );
  const [commentsMap, setCommentsMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(reviews.map((r) => [r.id, ''])),
  );

  const [ratedIds, setRatedIds] = useState<Set<string>>(
    () => new Set(ratedReviewIds),
  );
  const [applying, setApplying] = useState(false);

  const ratings = ratingsMap[selectedReviewId] ?? { ...DEFAULT_RATINGS };
  const comment = commentsMap[selectedReviewId] ?? '';
  const isRated = ratedIds.has(selectedReviewId);

  const handleApply = async () => {
    if (!selectedReviewId || isRated) return;
    setApplying(true);
    await onRate(selectedReviewId, { ...ratings }, comment);
    setRatedIds((prev) => new Set(prev).add(selectedReviewId));
    setApplying(false);
  };

  if (reviews.length === 0) return null;

  return (
    <div
      className="rounded-md p-5"
      style={{
        background: 'rgba(30,28,25,0.4)',
        border: '1px solid rgba(120,110,95,0.1)',
      }}
    >
      <h3 className="text-[14px] font-serif text-[#c9a44a] mb-2">
        Feedback to Reviewers
      </h3>
      <p className="text-[12px] text-[#8a8070] mb-4">
        Improve future reviews by scoring the reviews you have received. This
        score will affect a peer reviewer&apos;s reliability score and is
        insightful to editors for future submissions.
      </p>

      {/* Reviewer selector */}
      <select
        value={selectedReviewId}
        onChange={(e) => setSelectedReviewId(e.target.value)}
        className="w-full px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer mb-4"
        style={{
          background: 'rgba(45,42,38,0.5)',
          border: '1px solid rgba(120,110,95,0.15)',
        }}
      >
        {reviews.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
            {ratedIds.has(r.id) ? ' — Rated' : ''}
          </option>
        ))}
      </select>

      {isRated ? (
        <RatedBadge />
      ) : (
        <>
          {/* 5-protocol ratings */}
          <div className="flex flex-col gap-3 mb-4">
            {PROTOCOL_FULL_LABELS.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4 px-3 py-2 rounded"
                style={{ background: 'rgba(45,42,38,0.3)' }}
              >
                <span className="text-[12px] text-[#b0a898] flex-1">
                  {label}
                </span>
                <div className="flex gap-1 shrink-0">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setRatingsMap((prev) => ({
                          ...prev,
                          [selectedReviewId]: {
                            ...prev[selectedReviewId],
                            [key]: v,
                          },
                        }))
                      }
                      className="w-7 h-7 rounded text-[11px] font-medium cursor-pointer"
                      style={{
                        background:
                          ratings[key] === v
                            ? 'rgba(201,164,74,0.3)'
                            : 'rgba(120,110,95,0.1)',
                        color: ratings[key] === v ? '#c9a44a' : '#6a6050',
                        border: `1px solid ${
                          ratings[key] === v
                            ? 'rgba(201,164,74,0.4)'
                            : 'rgba(120,110,95,0.15)'
                        }`,
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) =>
              setCommentsMap((prev) => ({
                ...prev,
                [selectedReviewId]: e.target.value,
              }))
            }
            placeholder="Add your comment..."
            rows={2}
            className="w-full px-3 py-2 rounded-md text-[12px] font-serif text-[#d4ccc0] resize-none mb-3"
            style={{
              background: 'rgba(45,42,38,0.5)',
              border: '1px solid rgba(120,110,95,0.15)',
            }}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleApply}
              disabled={applying}
              className="px-5 py-2 rounded-md text-[12px] font-medium cursor-pointer"
              style={{
                background: 'rgba(90,122,154,0.15)',
                color: '#5a7a9a',
                border: '1px solid rgba(90,122,154,0.25)',
                opacity: applying ? 0.5 : 1,
              }}
            >
              {applying ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ReviewerFeedbackSection;
