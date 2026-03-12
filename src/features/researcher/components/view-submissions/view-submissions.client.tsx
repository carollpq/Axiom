'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { getStatusColors } from '@/src/shared/lib/status-colors';
import { authorResponseAction } from '@/src/features/submissions/actions';
import { rateReviewerAction } from '@/src/features/reviews/actions';
import { getErrorMessage } from '@/src/shared/lib/errors';
import { AlertBanner } from '@/src/shared/components/alert-banner';
import { ReviewsStatusSection } from './reviews-status-section.client';
import type {
  AnonymizedReview,
  ReviewerInfo,
} from '@/src/features/researcher/types/review';

const AuthorFeedback = dynamic(
  () => import('./author-feedback-section.client'),
);
const ReviewerFeedback = dynamic(
  () => import('./reviewer-feedback-section.client'),
);

interface SubmissionData {
  id: string;
  paperTitle: string;
  authors: string;
  abstract: string;
  status: string;
  reviewers: ReviewerInfo[];
  reviews: AnonymizedReview[];
  allReviewsComplete: boolean;
  authorResponseStatus: string | null;
}

interface Props {
  submissions: SubmissionData[];
}

export function ViewSubmissionsClient({ submissions }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    submissions[0]?.id ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = submissions.find((s) => s.id === selectedId);

  const handleAcceptReviews = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await authorResponseAction(selected.id, 'accept');
      toast.success('Reviews accepted');
      router.refresh();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvokeRebuttal = async (comment: string) => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await authorResponseAction(selected.id, 'request_rebuttal');
      toast.success('Rebuttal requested');
      router.refresh();
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRateReviewer = async (
    reviewId: string,
    ratings: Record<string, number>,
    comment: string,
  ) => {
    setError(null);
    try {
      const body: Record<string, unknown> = { ...ratings };
      if (comment.trim()) body.comment = comment.trim();

      const result = await rateReviewerAction(
        reviewId,
        body as Parameters<typeof rateReviewerAction>[1],
      );
      if (result.alreadyRated) return;
      toast.success('Rating submitted');
    } catch (err) {
      const message = getErrorMessage(err, 'Rating failed');
      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto py-8 px-10">
      <h1 className="text-[28px] font-serif font-normal text-[#e8e0d4] mb-1">
        View Submissions
      </h1>
      <p className="text-[13px] text-[#6a6050] italic mb-6">
        Track your submissions and respond to reviews
      </p>

      {error && (
        <AlertBanner variant="error" className="mb-4">
          {error}
        </AlertBanner>
      )}

      <div className="flex gap-6">
        {/* Left Panel: Submission Cards */}
        <div className="w-[320px] flex flex-col gap-3 shrink-0 max-h-[calc(100vh-200px)] overflow-y-auto">
          {submissions.length === 0 ? (
            <div
              className="rounded-md px-4 py-8 text-center text-[13px] text-[#6a6050]"
              style={{
                background: 'rgba(45,42,38,0.4)',
                border: '1px solid rgba(120,110,95,0.15)',
              }}
            >
              No submissions yet.
            </div>
          ) : (
            submissions.map((sub) => {
              const colors = getStatusColors(sub.status);
              const isSelected = selectedId === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedId(sub.id)}
                  className="text-left rounded-md p-4 cursor-pointer transition-colors"
                  style={{
                    background: isSelected
                      ? 'rgba(45,42,38,0.8)'
                      : 'rgba(45,42,38,0.4)',
                    border: isSelected
                      ? '1px solid rgba(201,164,74,0.3)'
                      : '1px solid rgba(120,110,95,0.15)',
                  }}
                >
                  <h3 className="text-[13px] font-serif text-[#e8e0d4] mb-1 line-clamp-2">
                    {sub.paperTitle}
                  </h3>
                  <p className="text-[11px] text-[#8a8070] mb-1">
                    {sub.authors}
                  </p>
                  <p className="text-[10px] text-[#6a6050] line-clamp-2 mb-2">
                    {sub.abstract}
                  </p>
                  <span
                    className="inline-block px-2 py-0.5 rounded text-[10px] font-medium"
                    style={{
                      background: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {sub.status}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Right Panel: Detail View */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div
              className="rounded-md p-6"
              style={{
                background: 'rgba(45,42,38,0.4)',
                border: '1px solid rgba(120,110,95,0.15)',
              }}
            >
              <h2 className="text-[18px] font-serif text-[#e8e0d4] mb-1">
                {selected.paperTitle}
              </h2>
              <p className="text-[12px] text-[#8a8070] mb-4">
                {selected.authors}
              </p>

              {/* Abstract */}
              {selected.abstract && (
                <div className="mb-5">
                  <h3 className="text-[11px] uppercase tracking-wider text-[#8a8070] mb-1.5">
                    Abstract
                  </h3>
                  <p className="text-[13px] text-[#b0a898] leading-[1.7] font-serif">
                    {selected.abstract}
                  </p>
                </div>
              )}

              {/* Reviews Status */}
              <ReviewsStatusSection
                reviewers={selected.reviewers}
                reviews={selected.reviews}
                allReviewsComplete={selected.allReviewsComplete}
                authorResponseStatus={selected.authorResponseStatus}
                onAccept={handleAcceptReviews}
                submitting={submitting}
              />

              {/* Author Feedback (conditional) */}
              {selected.allReviewsComplete &&
                !selected.authorResponseStatus && (
                  <AuthorFeedback
                    onInvokeRebuttal={handleInvokeRebuttal}
                    submitting={submitting}
                  />
                )}

              {/* Feedback to Reviewers (conditional) */}
              {selected.allReviewsComplete && (
                <ReviewerFeedback
                  reviews={selected.reviews}
                  onRate={handleRateReviewer}
                />
              )}
            </div>
          ) : (
            <div
              className="rounded-md px-6 py-16 text-center text-[13px] text-[#6a6050]"
              style={{
                background: 'rgba(45,42,38,0.4)',
                border: '1px solid rgba(120,110,95,0.15)',
              }}
            >
              Select a submission to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
