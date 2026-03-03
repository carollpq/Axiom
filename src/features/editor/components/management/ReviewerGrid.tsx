import type { PoolReviewer } from "@/src/features/editor/types";

interface ReviewerGridProps {
  reviewers: PoolReviewer[];
}

export function ReviewerGrid({ reviewers }: ReviewerGridProps) {
  return (
    <div className="mb-8">
      <div className="text-[10px] text-[#6a6050] uppercase tracking-[1.5px] mb-4">Reviewer Pool</div>
      <div className="grid grid-cols-4 gap-4">
        {reviewers.length === 0 && (
          <div className="col-span-4 py-6 text-center text-[13px] text-[#6a6050] italic">
            No reviewers in pool yet.
          </div>
        )}
        {reviewers.map((r) => (
          <div
            key={r.id}
            className="rounded-[6px] p-5 flex flex-col items-center text-center cursor-pointer transition-colors"
            style={{
              background: "rgba(45,42,38,0.5)",
              border: "1px solid rgba(120,110,95,0.2)",
            }}
          >
            {/* Avatar */}
            <div
              className="rounded-full flex items-center justify-center font-serif text-sm mb-3"
              style={{
                width: 56,
                height: 56,
                background: "linear-gradient(135deg, rgba(120,110,95,0.3), rgba(80,72,60,0.3))",
                border: "2px solid rgba(120,110,95,0.3)",
                color: "#c9b89e",
              }}
            >
              {r.name
                .split(" ")
                .filter((_, i, a) => i === 0 || i === a.length - 1)
                .map((w) => w[0])
                .join("")}
            </div>
            <div className="font-serif text-[12px] text-[#e8e0d4] mb-0.5">{r.name}</div>
            <div className="text-[10px] text-[#8a8070]">Rep Score: {r.score}</div>
            <div className="text-[10px] text-[#6a6050]">{r.field}</div>
          </div>
        ))}

        {/* Add new reviewer card */}
        <div
          className="rounded-[6px] p-5 flex flex-col items-center justify-center cursor-pointer transition-colors"
          style={{
            border: "2px dashed rgba(120,110,95,0.25)",
            minHeight: 140,
          }}
        >
          <div className="text-[12px] text-[#6a6050] font-serif text-center">
            Add new reviewer...
          </div>
        </div>
      </div>
    </div>
  );
}
