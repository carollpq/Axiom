import type { ReviewerWithStatus } from "@/src/features/editor/types";

interface ReviewCommentsPanelProps {
  reviewers: ReviewerWithStatus[];
}

export function ReviewCommentsPanel({ reviewers }: ReviewCommentsPanelProps) {
  return (
    <div
      className="p-4"
      style={{ borderBottom: "1px solid rgba(120,110,95,0.1)" }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">Reviews</div>

      <div className="space-y-2">
        {reviewers.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between px-3 py-2.5 rounded"
            style={{
              background: "rgba(45,42,38,0.5)",
              border: "1px solid rgba(180,160,120,0.2)",
            }}
          >
            <span className="text-[12px] text-[#d4ccc0] font-serif">
              {r.name}
            </span>
            <button
              className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer"
              style={{
                background: "rgba(180,160,120,0.15)",
                border: "1px solid rgba(180,160,120,0.3)",
                color: "#c9a44a",
              }}
            >
              See comment...
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
