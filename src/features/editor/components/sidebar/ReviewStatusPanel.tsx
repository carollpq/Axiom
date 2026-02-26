import type { ReviewerWithStatus, ReviewStatus } from "@/src/shared/types/editor-dashboard";

const statusColors: Record<ReviewStatus, { bg: string; text: string; border: string }> = {
  complete:    { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
  in_progress: { bg: "rgba(180,180,120,0.15)", text: "#c9b458", border: "rgba(180,180,120,0.3)" },
  rejected:    { bg: "rgba(200,100,90,0.15)",  text: "#d4645a", border: "rgba(200,100,90,0.3)" },
  pending:     { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
};

const statusLabels: Record<ReviewStatus, string> = {
  complete: "Complete",
  in_progress: "In Progress",
  rejected: "Rejected",
  pending: "Pending",
};

interface ReviewStatusPanelProps {
  reviewers: ReviewerWithStatus[];
}

export function ReviewStatusPanel({ reviewers }: ReviewStatusPanelProps) {
  return (
    <div
      className="p-4"
      style={{ borderBottom: "1px solid rgba(120,110,95,0.1)" }}
    >
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-3">
        Review Status
      </div>

      <div className="space-y-2">
        {reviewers.map((r) => {
          const c = statusColors[r.status];
          return (
            <div
              key={r.id}
              className="flex items-center justify-between px-3 py-2.5 rounded"
              style={{
                background: "rgba(45,42,38,0.5)",
                border: "1px solid rgba(120,110,95,0.15)",
              }}
            >
              <span className="text-[12px] text-[#d4ccc0] font-serif">
                {r.name}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm"
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                  }}
                >
                  {statusLabels[r.status]}
                </span>
                {r.hasComment && (
                  <button
                    className="text-[10px] text-[#8a8070] hover:text-[#c9b89e] cursor-pointer"
                  >
                    See comment...
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
