"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getStatusColors } from "@/src/features/researcher/constants/status-colors";
import { ReviewsStatusSection } from "./ReviewsStatusSection";
import { AuthorFeedbackSection } from "./AuthorFeedbackSection";
import { ReviewerFeedbackSection } from "./ReviewerFeedbackSection";

interface ReviewerInfo {
  assignmentId: string;
  label: string;
  status: "in_progress" | "complete";
  reviewId?: string;
}

interface AnonymizedReview {
  id: string;
  label: string;
  criteriaEvaluations: string | null;
  strengths: string | null;
  weaknesses: string | null;
  questionsForAuthors: string | null;
  recommendation: string | null;
}

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
      const res = await fetch(
        `/api/submissions/${selected.id}/author-response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept" }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to accept reviews");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvokeRebuttal = async (comment: string) => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/submissions/${selected.id}/author-response`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "request_rebuttal",
            comment: comment || undefined,
          }),
        },
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to invoke rebuttal");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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

      const res = await fetch(`/api/reviews/${reviewId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok && res.status !== 409) {
        const data = await res.json();
        throw new Error(data.error || "Failed to rate reviewer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rating failed");
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
        <div
          className="rounded-md px-4 py-3 mb-4 text-[13px]"
          style={{
            background: "rgba(212,100,90,0.15)",
            color: "#d4645a",
            border: "1px solid rgba(212,100,90,0.3)",
          }}
        >
          {error}
        </div>
      )}

      <div className="flex gap-6">
        {/* Left Panel: Submission Cards */}
        <div className="w-[320px] flex flex-col gap-3 shrink-0 max-h-[calc(100vh-200px)] overflow-y-auto">
          {submissions.length === 0 ? (
            <div
              className="rounded-md px-4 py-8 text-center text-[13px] text-[#6a6050]"
              style={{
                background: "rgba(45,42,38,0.4)",
                border: "1px solid rgba(120,110,95,0.15)",
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
                      ? "rgba(45,42,38,0.8)"
                      : "rgba(45,42,38,0.4)",
                    border: isSelected
                      ? "1px solid rgba(201,164,74,0.3)"
                      : "1px solid rgba(120,110,95,0.15)",
                  }}
                >
                  <h3 className="text-[13px] font-serif text-[#e8e0d4] mb-1 line-clamp-2">
                    {sub.paperTitle}
                  </h3>
                  <p className="text-[11px] text-[#8a8070] mb-1">{sub.authors}</p>
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
                background: "rgba(45,42,38,0.4)",
                border: "1px solid rgba(120,110,95,0.15)",
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
                  <AuthorFeedbackSection
                    onInvokeRebuttal={handleInvokeRebuttal}
                    submitting={submitting}
                  />
                )}

              {/* Feedback to Reviewers (conditional) */}
              {selected.allReviewsComplete && (
                <ReviewerFeedbackSection
                  reviews={selected.reviews}
                  onRate={handleRateReviewer}
                />
              )}
            </div>
          ) : (
            <div
              className="rounded-md px-6 py-16 text-center text-[13px] text-[#6a6050]"
              style={{
                background: "rgba(45,42,38,0.4)",
                border: "1px solid rgba(120,110,95,0.15)",
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
