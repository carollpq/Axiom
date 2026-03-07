"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewContent, type ReviewCriterion } from "./ReviewContent";

interface AnonymizedReview {
  id: string;
  label: string;
  criteriaEvaluations: string | null;
  strengths: string | null;
  weaknesses: string | null;
  questionsForAuthors: string | null;
  recommendation: string | null;
  submittedAt: string;
}

interface ProtocolRatings {
  actionableFeedback: number;
  deepEngagement: number;
  fairObjective: number;
  justifiedRecommendation: number;
  appropriateExpertise: number;
}

const PROTOCOL_LABELS: { key: keyof ProtocolRatings; label: string }[] = [
  { key: "actionableFeedback", label: "Actionable Feedback" },
  { key: "deepEngagement", label: "Deep Engagement" },
  { key: "fairObjective", label: "Fair & Objective" },
  { key: "justifiedRecommendation", label: "Justified Recommendation" },
  { key: "appropriateExpertise", label: "Appropriate Expertise" },
];

const DEFAULT_RATINGS: ProtocolRatings = {
  actionableFeedback: 3,
  deepEngagement: 3,
  fairObjective: 3,
  justifiedRecommendation: 3,
  appropriateExpertise: 3,
};

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
  const [ratings, setRatings] = useState<Record<string, ProtocolRatings>>(
    () => Object.fromEntries(reviews.map((r) => [r.id, { ...DEFAULT_RATINGS }])),
  );
  const [comments, setComments] = useState<Record<string, string>>(
    () => Object.fromEntries(reviews.map((r) => [r.id, ""])),
  );

  function updateRating(reviewId: string, key: keyof ProtocolRatings, value: number) {
    setRatings((prev) => ({
      ...prev,
      [reviewId]: { ...prev[reviewId], [key]: value },
    }));
  }

  async function handleSubmit(action: "accept" | "request_rebuttal") {
    setSubmitting(true);
    setError(null);

    try {
      // Submit ratings for each review
      await Promise.all(
        reviews.map(async (r) => {
          const body: Record<string, unknown> = { ...ratings[r.id] };
          if (comments[r.id]?.trim()) body.comment = comments[r.id].trim();
          const res = await fetch(`/api/reviews/${r.id}/rate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const data = await res.json();
            // Ignore "already rated" — proceed with author response
            if (res.status !== 409) throw new Error(data.error || "Failed to rate review");
          }
        }),
      );

      // Submit author response
      const res = await fetch(`/api/submissions/${submissionId}/author-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit response");
      }

      router.push("/researcher");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-[24px] font-serif text-[#e8e0d4] mb-1">Review Response</h1>
      <p className="text-[13px] text-[#8a8070] mb-6">
        {paperTitle} &mdash; {journalName}
      </p>

      {error && (
        <div
          className="rounded-md px-4 py-3 mb-6 text-[13px]"
          style={{ background: "rgba(212,100,90,0.15)", color: "#d4645a", border: "1px solid rgba(212,100,90,0.3)" }}
        >
          {error}
        </div>
      )}

      <p className="text-[12px] text-[#6a6050] mb-6">
        All reviews are complete. Please rate each reviewer and then accept the reviews or request a rebuttal.
      </p>

      {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-md p-6 mb-5"
            style={{
              background: "rgba(45,42,38,0.4)",
              border: "1px solid rgba(120,110,95,0.15)",
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

            {/* 5-Protocol Rating */}
            <div
              className="rounded-md p-4 mt-4"
              style={{ background: "rgba(30,28,25,0.5)", border: "1px solid rgba(120,110,95,0.1)" }}
            >
              <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
                Rate This Reviewer
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-3">
                {PROTOCOL_LABELS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-[10px] text-[#8a8070] block mb-1">{label}</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => updateRating(review.id, key, v)}
                          className="w-7 h-7 rounded text-[11px] font-medium transition-colors"
                          style={{
                            background:
                              ratings[review.id]?.[key] === v
                                ? "rgba(201,164,74,0.3)"
                                : "rgba(120,110,95,0.1)",
                            color:
                              ratings[review.id]?.[key] === v ? "#c9a44a" : "#6a6050",
                            border: `1px solid ${
                              ratings[review.id]?.[key] === v
                                ? "rgba(201,164,74,0.4)"
                                : "rgba(120,110,95,0.15)"
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
              <div>
                <label className="text-[10px] text-[#8a8070] block mb-1">
                  Anonymous Comment (optional)
                </label>
                <textarea
                  className="w-full rounded-md px-3 py-2 text-[12px] text-[#d4ccc0] font-serif resize-none"
                  style={{
                    background: "rgba(45,42,38,0.5)",
                    border: "1px solid rgba(120,110,95,0.15)",
                  }}
                  rows={2}
                  placeholder="Optional feedback for this reviewer..."
                  value={comments[review.id] ?? ""}
                  onChange={(e) =>
                    setComments((prev) => ({ ...prev, [review.id]: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
      ))}

      {/* Action Bar */}
      <div
        className="flex items-center justify-between rounded-md px-6 py-4 mt-6"
        style={{
          background: "rgba(45,42,38,0.6)",
          border: "1px solid rgba(120,110,95,0.2)",
        }}
      >
        <p className="text-[11px] text-[#6a6050] max-w-[400px]">
          &ldquo;Accept&rdquo; signals you agree with the reviews. &ldquo;Request Rebuttal&rdquo; opens a 14-day
          window to challenge specific reviewer comments.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit("accept")}
            className="px-5 py-2 rounded-md text-[12px] font-medium transition-colors cursor-pointer"
            style={{
              background: "rgba(143,188,143,0.2)",
              color: "#8fbc8f",
              border: "1px solid rgba(143,188,143,0.3)",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Accept Reviews"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit("request_rebuttal")}
            className="px-5 py-2 rounded-md text-[12px] font-medium transition-colors cursor-pointer"
            style={{
              background: "rgba(201,164,74,0.15)",
              color: "#c9a44a",
              border: "1px solid rgba(201,164,74,0.3)",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Request Rebuttal"}
          </button>
        </div>
      </div>
    </div>
  );
}
