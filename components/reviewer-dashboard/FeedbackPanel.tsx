import type { FeedbackItem, CompletedReview } from "@/types/reviewer-dashboard";
import { Stars } from "./Stars";

interface FeedbackPanelProps {
  feedbackItems: FeedbackItem[];
  averageUsefulness: number;
  getReviewForFeedback: (reviewId: number) => CompletedReview | undefined;
}

export function FeedbackPanel({ feedbackItems, averageUsefulness, getReviewForFeedback }: FeedbackPanelProps) {
  return (
    <div>
      {/* Aggregate Card */}
      <div
        className="rounded-md p-5 mb-5"
        style={{
          background: "rgba(45,42,38,0.5)",
          border: "1px solid rgba(120,110,95,0.15)",
        }}
      >
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
          Aggregate Feedback
        </div>
        <div className="flex gap-8 items-center flex-wrap">
          <div>
            <div className="text-[11px] text-[#6a6050] mb-1">Average Usefulness</div>
            <Stars rating={averageUsefulness} />
          </div>
          <div>
            <div className="text-[11px] text-[#6a6050] mb-1">Total Ratings</div>
            <span className="text-[20px] font-serif text-[#e8e0d4]">{feedbackItems.length}</span>
          </div>
          <div className="text-[10px] text-[#4a4238] italic max-w-[300px]">
            All feedback is anonymous. You cannot identify which author provided a rating.
          </div>
        </div>
      </div>

      {/* Individual Feedback Items */}
      <div className="flex flex-col gap-2">
        {feedbackItems.map((f) => {
          const review = getReviewForFeedback(f.reviewId);
          return (
            <div
              key={f.reviewId}
              className="flex items-center gap-4 px-5 py-3.5 rounded-md"
              style={{
                background: "rgba(45,42,38,0.3)",
                border: "1px solid rgba(120,110,95,0.1)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[16px] text-[#6a6050]"
                style={{ background: "rgba(120,110,95,0.15)" }}
              >
                {"\u2606"}
              </div>
              <div className="flex-1">
                <div className="text-[13px] text-[#d4ccc0]">
                  {review ? review.title : "Unknown paper"}
                </div>
                <div className="text-[11px] text-[#6a6050] mt-0.5">
                  {review ? review.journal : ""} - Anonymous author feedback
                </div>
              </div>
              <div className="text-right">
                <Stars rating={f.usefulness} />
                <div className="text-[10px] text-[#6a6050] mt-0.5 italic">{f.comment}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
