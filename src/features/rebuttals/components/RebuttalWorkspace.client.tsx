"use client";

import { useRebuttal } from "@/src/features/rebuttals/hooks/useRebuttal";

interface ReviewForRebuttal {
  id: string;
  anonymousLabel: string;
  criteriaEvaluations: string | null;
  strengths: string | null;
  weaknesses: string | null;
  questionsForAuthors: string | null;
  recommendation: string | null;
}

interface RebuttalWorkspaceProps {
  rebuttalId: string;
  rebuttalStatus: string;
  deadline: string;
  reviews: ReviewForRebuttal[];
  existingResponses?: {
    reviewId: string;
    position: string;
    justification: string;
  }[];
  resolution?: string | null;
  editorNotes?: string | null;
}

export function RebuttalWorkspace({
  rebuttalId,
  rebuttalStatus,
  deadline,
  reviews,
  existingResponses,
  resolution,
  editorNotes,
}: RebuttalWorkspaceProps) {
  const {
    responses,
    selectedReviewId,
    isSubmitting,
    submitted,
    error,
    selectReview,
    setPosition,
    setJustification,
    submitRebuttal,
  } = useRebuttal(
    rebuttalId,
    reviews.map((r) => r.id),
  );

  const selectedReview = reviews.find((r) => r.id === selectedReviewId);
  const deadlineDate = new Date(deadline);
  const isPastDeadline = deadlineDate < new Date();
  const isReadOnly = rebuttalStatus !== "open" || isPastDeadline || submitted;

  return (
    <div className="h-[calc(100vh-120px)] flex gap-0">
      {/* Left: Review list */}
      <div
        className="w-[220px] shrink-0 overflow-y-auto"
        style={{
          borderRight: "1px solid rgba(120,110,95,0.15)",
          background: "rgba(30,28,24,0.3)",
        }}
      >
        <div className="p-4">
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
            Reviews to Address
          </div>
          <div className="space-y-1">
            {reviews.map((r) => {
              const resp = responses[r.id];
              const hasResponse = resp?.justification?.trim();
              return (
                <button
                  key={r.id}
                  onClick={() => selectReview(r.id)}
                  className="w-full text-left px-3 py-2.5 rounded cursor-pointer transition-colors"
                  style={{
                    background:
                      selectedReviewId === r.id
                        ? "rgba(201,164,74,0.1)"
                        : "transparent",
                    border:
                      selectedReviewId === r.id
                        ? "1px solid rgba(201,164,74,0.3)"
                        : "1px solid transparent",
                  }}
                >
                  <div className="text-[12px] text-[#d4ccc0] font-serif">
                    {r.anonymousLabel}
                  </div>
                  <div className="text-[10px] text-[#6a6050] mt-0.5">
                    {hasResponse ? (resp.position === "agree" ? "Agrees" : "Disagrees") : "No response yet"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Deadline info */}
        <div
          className="p-4"
          style={{ borderTop: "1px solid rgba(120,110,95,0.1)" }}
        >
          <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-1">
            Deadline
          </div>
          <div
            className="text-[12px] font-serif"
            style={{ color: isPastDeadline ? "#d4645a" : "#b0a898" }}
          >
            {deadlineDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {isPastDeadline && " (expired)"}
          </div>
        </div>
      </div>

      {/* Center: Selected review content */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedReview ? (
          <div className="max-w-[700px]">
            <h2 className="text-[18px] text-[#e8e0d4] font-serif mb-4">
              {selectedReview.anonymousLabel}
            </h2>

            {selectedReview.recommendation && (
              <div className="mb-4">
                <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-1">
                  Recommendation
                </div>
                <div className="text-[13px] text-[#d4ccc0] font-serif capitalize">
                  {selectedReview.recommendation}
                </div>
              </div>
            )}

            {selectedReview.strengths && (
              <div className="mb-4">
                <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-1">
                  Strengths
                </div>
                <div
                  className="text-[13px] text-[#b0a898] font-serif leading-relaxed p-3 rounded"
                  style={{ background: "rgba(45,42,38,0.4)" }}
                >
                  {selectedReview.strengths}
                </div>
              </div>
            )}

            {selectedReview.weaknesses && (
              <div className="mb-4">
                <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-1">
                  Weaknesses
                </div>
                <div
                  className="text-[13px] text-[#b0a898] font-serif leading-relaxed p-3 rounded"
                  style={{ background: "rgba(45,42,38,0.4)" }}
                >
                  {selectedReview.weaknesses}
                </div>
              </div>
            )}

            {selectedReview.questionsForAuthors && (
              <div className="mb-4">
                <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-1">
                  Questions for Authors
                </div>
                <div
                  className="text-[13px] text-[#b0a898] font-serif leading-relaxed p-3 rounded"
                  style={{ background: "rgba(45,42,38,0.4)" }}
                >
                  {selectedReview.questionsForAuthors}
                </div>
              </div>
            )}

            {selectedReview.criteriaEvaluations && (
              <div className="mb-4">
                <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-1">
                  Criteria Evaluations
                </div>
                <div
                  className="text-[13px] text-[#b0a898] font-serif leading-relaxed p-3 rounded"
                  style={{ background: "rgba(45,42,38,0.4)" }}
                >
                  {selectedReview.criteriaEvaluations}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-[#6a6050] font-serif mt-20">
            Select a review to view and respond
          </div>
        )}
      </div>

      {/* Right: Response form */}
      <div
        className="w-[300px] shrink-0 overflow-y-auto"
        style={{
          borderLeft: "1px solid rgba(120,110,95,0.15)",
          background: "rgba(30,28,24,0.3)",
        }}
      >
        {/* Resolution result (if resolved) */}
        {rebuttalStatus === "resolved" && resolution && (
          <div
            className="p-4"
            style={{ borderBottom: "1px solid rgba(120,110,95,0.1)" }}
          >
            <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-2">
              Resolution
            </div>
            <div
              className="text-[13px] font-serif font-semibold mb-2"
              style={{
                color:
                  resolution === "upheld"
                    ? "#8fbc8f"
                    : resolution === "rejected"
                      ? "#d4645a"
                      : "#c9a44a",
              }}
            >
              {resolution === "upheld"
                ? "Rebuttal Upheld"
                : resolution === "rejected"
                  ? "Rebuttal Rejected"
                  : "Partially Upheld"}
            </div>
            {editorNotes && (
              <p className="text-[12px] text-[#8a8070] font-serif">{editorNotes}</p>
            )}
          </div>
        )}

        {/* Submitted confirmation */}
        {(rebuttalStatus === "submitted" || submitted) && !resolution && (
          <div className="p-4">
            <div
              className="rounded-lg p-4 text-center"
              style={{
                background: "rgba(143,188,143,0.08)",
                border: "1px solid rgba(143,188,143,0.3)",
              }}
            >
              <div className="text-[14px] text-[#8fbc8f] font-serif mb-1">
                Rebuttal Submitted
              </div>
              <div className="text-[11px] text-[#6a6050] font-serif">
                Your responses have been submitted. The editor will review them.
              </div>
            </div>
          </div>
        )}

        {/* Response form (only when open) */}
        {selectedReviewId && !isReadOnly && (
          <div className="p-4">
            <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
              Your Response
            </div>

            <div className="flex gap-2 mb-3">
              {(["agree", "disagree"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setPosition(selectedReviewId, pos)}
                  className="flex-1 py-2 rounded text-[12px] font-serif cursor-pointer transition-colors"
                  style={{
                    background:
                      responses[selectedReviewId]?.position === pos
                        ? pos === "agree"
                          ? "rgba(120,180,120,0.2)"
                          : "rgba(200,100,90,0.2)"
                        : "rgba(45,42,38,0.5)",
                    border: `1px solid ${
                      responses[selectedReviewId]?.position === pos
                        ? pos === "agree"
                          ? "rgba(120,180,120,0.4)"
                          : "rgba(200,100,90,0.4)"
                        : "rgba(120,110,95,0.2)"
                    }`,
                    color:
                      responses[selectedReviewId]?.position === pos
                        ? pos === "agree"
                          ? "#8fbc8f"
                          : "#d4645a"
                        : "#8a8070",
                  }}
                >
                  {pos === "agree" ? "Agree" : "Disagree"}
                </button>
              ))}
            </div>

            <textarea
              value={responses[selectedReviewId]?.justification ?? ""}
              onChange={(e) => setJustification(selectedReviewId, e.target.value)}
              placeholder="Provide your justification..."
              rows={6}
              className="w-full rounded-[6px] p-3 text-[12px] font-serif text-[#d4ccc0] outline-none resize-none mb-3"
              style={{
                background: "rgba(30,28,24,0.6)",
                border: "1px solid rgba(120,110,95,0.2)",
              }}
            />

            {error && (
              <div className="text-[11px] text-[#d4645a] font-serif mb-2">{error}</div>
            )}

            <button
              onClick={submitRebuttal}
              disabled={isSubmitting}
              className="w-full px-4 py-2 rounded text-[12px] font-serif cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))",
                border: "1px solid rgba(180,160,120,0.4)",
                color: "#d4c8a8",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Rebuttal"}
            </button>
          </div>
        )}

        {/* Show existing responses (read-only view for submitted/resolved) */}
        {isReadOnly && existingResponses && existingResponses.length > 0 && !resolution && rebuttalStatus !== "submitted" && !submitted && (
          <div className="p-4">
            <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
              Past Deadline
            </div>
            <div className="text-[12px] text-[#d4645a] font-serif">
              The rebuttal deadline has passed.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
