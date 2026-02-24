import type { PaperReview } from "@/features/author/types/explorer";

interface ReviewsTabProps {
  reviews: PaperReview[];
  decision: string | null;
  status: string;
}

export function ReviewsTab({ reviews, decision, status }: ReviewsTabProps) {
  if (reviews.length === 0) {
    return (
      <div
        className="p-10 text-center rounded-lg"
        style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)" }}
      >
        <div className="text-sm text-[#6a6050] italic">
          {status === "Under Review" ? "Reviews are in progress" : "No reviews available"}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Decision banner */}
      {decision && (
        <div
          className="py-3.5 px-5 mb-4 rounded-md flex justify-between items-center"
          style={{
            background: decision === "Accepted" ? "rgba(120,180,120,0.06)" : "rgba(200,100,90,0.06)",
            border: "1px solid " + (decision === "Accepted" ? "rgba(120,180,120,0.2)" : "rgba(200,100,90,0.2)"),
          }}
        >
          <span
            className="text-[13px] font-semibold"
            style={{ color: decision === "Accepted" ? "#8fbc8f" : "#d4645a" }}
          >Decision: {decision}</span>
          <span className="text-[10px] text-[#5a7a9a] font-mono cursor-pointer">View on-chain {"\u2197"}</span>
        </div>
      )}

      {/* Pre-registered criteria note */}
      <div
        className="py-2.5 px-4 mb-4 rounded flex justify-between items-center"
        style={{ background: "rgba(130,160,200,0.06)", border: "1px solid rgba(130,160,200,0.15)" }}
      >
        <span className="text-[11px] text-[#7a9fc7]">Pre-registered review criteria published on-chain</span>
        <span className="text-[10px] text-[#5a7a9a] font-mono cursor-pointer">View criteria {"\u2197"}</span>
      </div>

      {/* Review cards */}
      {reviews.map((r, ri) => (
        <div
          key={ri}
          className="rounded-lg p-[22px] mb-3.5"
          style={{ background: "rgba(45,42,38,0.5)", border: "1px solid rgba(120,110,95,0.15)" }}
        >
          {/* Reviewer + recommendation */}
          <div className="flex justify-between items-center mb-3.5">
            <span className="text-[13px] text-[#d4ccc0]">{r.reviewer}</span>
            <span
              className="text-[11px] py-0.5 px-2.5 rounded-sm"
              style={{
                background: r.rec === "Accept" ? "rgba(120,180,120,0.12)" : "rgba(180,180,120,0.12)",
                color: r.rec === "Accept" ? "#8fbc8f" : "#c9b458",
                border: "1px solid " + (r.rec === "Accept" ? "rgba(120,180,120,0.25)" : "rgba(180,180,120,0.25)"),
              }}
            >{r.rec}</span>
          </div>

          {/* Criteria */}
          <div className="mb-3.5">
            <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-2">Criteria Evaluation</div>
            {r.criteria.map((c, ci) => (
              <div
                key={ci}
                className="flex justify-between items-center py-1.5"
                style={{ borderBottom: ci < r.criteria.length - 1 ? "1px solid rgba(120,110,95,0.06)" : "none" }}
              >
                <span className="text-xs text-[#b0a898]">{c.label}</span>
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: c.met === "Yes" ? "#8fbc8f" : c.met === "Partially" ? "#c9b458" : "#d4645a" }}
                >{c.met}</span>
              </div>
            ))}
          </div>

          {/* Strengths */}
          <div className="mb-2">
            <div className="text-[10px] text-[#8fbc8f] uppercase tracking-[1px] mb-1">Strengths</div>
            <div className="text-xs text-[#8a8070] leading-normal">{r.strengths}</div>
          </div>

          {/* Weaknesses */}
          <div>
            <div className="text-[10px] text-[#d4a45a] uppercase tracking-[1px] mb-1">Weaknesses</div>
            <div className="text-xs text-[#8a8070] leading-normal">{r.weaknesses}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
