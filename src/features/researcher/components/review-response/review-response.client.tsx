'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ReviewContent, type ReviewCriterion } from './review-content';
import { ReviewerRatingCard } from './reviewer-rating-card.client';
import { AlertBanner } from '@/src/shared/components/alert-banner';
import { rateReviewerAction } from '@/src/features/reviews/actions';
import { authorResponseAction } from '@/src/features/submissions/actions';
import { ROUTES } from '@/src/shared/lib/routes';
import { getErrorMessage } from '@/src/shared/lib/errors';
import type {
  AnonymizedReview,
  ProtocolRatings,
} from '@/src/features/researcher/types/review';
import { DEFAULT_RATINGS } from '@/src/features/researcher/config/review';

interface Props {
  submissionId: string;
  paperTitle: string;
  journalName: string;
  reviews: AnonymizedReview[];
  criteria: ReviewCriterion[];
}

export function ReviewResponseClient({
  submissionId,
  paperTitle,
  journalName,
  reviews,
  criteria,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Per-review ratings state (lazy initializers avoid re-computing on every render)
  const [ratings, setRatings] = useState<Record<string, ProtocolRatings>>(() =>
    Object.fromEntries(reviews.map((r) => [r.id, { ...DEFAULT_RATINGS }])),
  );
  const [comments, setComments] = useState<Record<string, string>>(() =>
    Object.fromEntries(reviews.map((r) => [r.id, ''])),
  );

  function updateRating(
    reviewId: string,
    key: keyof ProtocolRatings,
    value: number,
  ) {
    setRatings((prev) => ({
      ...prev,
      [reviewId]: { ...prev[reviewId], [key]: value },
    }));
  }

  async function handleSubmit(action: 'accept' | 'request_rebuttal') {
    setSubmitting(true);
    setError(null);

    try {
      // Submit ratings for each review
      await Promise.all(
        reviews.map(async (r) => {
          const body: Record<string, unknown> = { ...ratings[r.id] };
          if (comments[r.id]?.trim()) body.comment = comments[r.id].trim();
          const result = await rateReviewerAction(
            r.id,
            body as Parameters<typeof rateReviewerAction>[1],
          );
          // Ignore "already rated" — proceed with author response
          if (result.alreadyRated) return;
        }),
      );

      // Submit author response
      await authorResponseAction(submissionId, action);

      toast.success('Response submitted');
      router.push(ROUTES.researcher.root);
      router.refresh();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-[24px] font-serif text-[#e8e0d4] mb-1">
        Review Response
      </h1>
      <p className="text-[13px] text-[#8a8070] mb-6">
        {paperTitle} &mdash; {journalName}
      </p>

      {error && <AlertBanner variant="error">{error}</AlertBanner>}

      <p className="text-[12px] text-[#6a6050] mb-6">
        All reviews are complete. Please rate each reviewer and then accept the
        reviews or request a rebuttal.
      </p>

      {reviews.map((review) => (
        <div
          key={review.id}
          data-testid="review-response-card"
          className="rounded-md p-6 mb-5"
          style={{
            background: 'rgba(45,42,38,0.4)',
            border: '1px solid rgba(120,110,95,0.15)',
          }}
        >
          <ReviewContent
            criteriaEvaluations={review.criteriaEvaluations}
            strengths={review.strengths}
            weaknesses={review.weaknesses}
            questionsForAuthors={review.questionsForAuthors}
            recommendation={review.recommendation}
            criteria={criteria}
            label={review.label}
          />

          <ReviewerRatingCard
            reviewId={review.id}
            ratings={ratings[review.id]}
            comment={comments[review.id] ?? ''}
            onRatingChange={(key, value) => updateRating(review.id, key, value)}
            onCommentChange={(value) =>
              setComments((prev) => ({ ...prev, [review.id]: value }))
            }
          />
        </div>
      ))}

      {/* Action Bar */}
      <div
        className="flex items-center justify-between rounded-md px-6 py-4 mt-6"
        style={{
          background: 'rgba(45,42,38,0.6)',
          border: '1px solid rgba(120,110,95,0.2)',
        }}
      >
        <p className="text-[11px] text-[#6a6050] max-w-[400px]">
          &ldquo;Accept&rdquo; signals you agree with the reviews.
          &ldquo;Request Rebuttal&rdquo; opens a 14-day window to challenge
          specific reviewer comments.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            data-testid="accept-reviews-btn"
            disabled={submitting}
            onClick={() => handleSubmit('accept')}
            className="px-5 py-2 rounded-md text-[12px] font-medium transition-colors cursor-pointer"
            style={{
              background: 'rgba(143,188,143,0.2)',
              color: '#8fbc8f',
              border: '1px solid rgba(143,188,143,0.3)',
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Accept Reviews'}
          </button>
          <button
            type="button"
            data-testid="request-rebuttal-btn"
            disabled={submitting}
            onClick={() => handleSubmit('request_rebuttal')}
            className="px-5 py-2 rounded-md text-[12px] font-medium transition-colors cursor-pointer"
            style={{
              background: 'rgba(201,164,74,0.15)',
              color: '#c9a44a',
              border: '1px solid rgba(201,164,74,0.3)',
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? 'Submitting...' : 'Request Rebuttal'}
          </button>
        </div>
      </div>
    </div>
  );
}
