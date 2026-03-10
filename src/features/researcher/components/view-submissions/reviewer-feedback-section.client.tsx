'use client';

import { useState } from 'react';

interface AnonymizedReview {
  id: string;
  label: string;
}

const PROTOCOL_LABELS = [
  {
    key: 'actionableFeedback',
    label: 'The review provides clear, actionable feedback.',
  },
  { key: 'fairObjective', label: 'The review was fair and objective.' },
  {
    key: 'deepEngagement',
    label: 'The reviewer demonstrated deep engagement with the manuscript.',
  },
  {
    key: 'justifiedRecommendation',
    label: 'The recommendation was clearly justified.',
  },
  {
    key: 'appropriateExpertise',
    label: 'The reviewer demonstrated appropriate expertise.',
  },
] as const;

type RatingKey = (typeof PROTOCOL_LABELS)[number]['key'];

interface Props {
  reviews: AnonymizedReview[];
  onRate: (
    reviewId: string,
    ratings: Record<string, number>,
    comment: string,
  ) => Promise<void>;
}

export function ReviewerFeedbackSection({ reviews, onRate }: Props) {
  const [selectedReviewId, setSelectedReviewId] = useState(
    reviews[0]?.id ?? '',
  );
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    actionableFeedback: 3,
    fairObjective: 3,
    deepEngagement: 3,
    justifiedRecommendation: 3,
    appropriateExpertise: 3,
  });
  const [comment, setComment] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    if (!selectedReviewId) return;
    setApplying(true);
    await onRate(selectedReviewId, ratings, comment);
    setApplying(false);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
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
        onChange={(e) => {
          setSelectedReviewId(e.target.value);
          setApplied(false);
        }}
        className="w-full px-3 py-2.5 rounded-md text-[13px] font-serif text-[#d4ccc0] cursor-pointer mb-4"
        style={{
          background: 'rgba(45,42,38,0.5)',
          border: '1px solid rgba(120,110,95,0.15)',
        }}
      >
        {reviews.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>

      {/* 5-protocol ratings */}
      <div className="flex flex-col gap-3 mb-4">
        {PROTOCOL_LABELS.map(({ key, label }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 px-3 py-2 rounded"
            style={{ background: 'rgba(45,42,38,0.3)' }}
          >
            <span className="text-[12px] text-[#b0a898] flex-1">{label}</span>
            <div className="flex gap-1 shrink-0">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRatings((prev) => ({ ...prev, [key]: v }))}
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
        onChange={(e) => setComment(e.target.value)}
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
            background: applied
              ? 'rgba(143,188,143,0.2)'
              : 'rgba(90,122,154,0.15)',
            color: applied ? '#8fbc8f' : '#5a7a9a',
            border: `1px solid ${applied ? 'rgba(143,188,143,0.3)' : 'rgba(90,122,154,0.25)'}`,
            opacity: applying ? 0.5 : 1,
          }}
        >
          {applying ? 'Applying...' : applied ? 'Applied!' : 'Apply'}
        </button>
      </div>
    </div>
  );
}

export default ReviewerFeedbackSection;
