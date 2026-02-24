import type { JournalSubmission, ReviewCriterion } from "@/src/shared/types/journal-dashboard";

interface CriteriaTabProps {
  submission: JournalSubmission;
  criteria: ReviewCriterion[];
}

export function CriteriaTab({ submission, criteria }: CriteriaTabProps) {
  if (submission.criteriaPublished) {
    return (
      <div>
        <div
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded"
          style={{
            background: "rgba(120,180,120,0.08)",
            border: "1px solid rgba(120,180,120,0.2)",
          }}
        >
          <span className="text-[#8fbc8f] text-sm">{"\u2713"}</span>
          <span className="text-[11px] text-[#8fbc8f]">
            Criteria published on-chain and immutable
          </span>
        </div>
        {criteria.map((c, i) => (
          <div
            key={i}
            className="flex justify-between items-center py-2.5"
            style={{
              borderBottom: i < criteria.length - 1 ? "1px solid rgba(120,110,95,0.08)" : "none",
            }}
          >
            <span className="text-xs text-[#d4ccc0]">{c.label}</span>
            <span
              className="text-[10px] text-[#6a6050] px-2 py-0.5 rounded-[3px]"
              style={{ background: "rgba(120,110,95,0.1)" }}
            >
              {c.type}
            </span>
          </div>
        ))}
        <div className="mt-3 text-[10px] text-[#5a7a9a] font-mono">
          Criteria hash: 0x7c91...e3f2 {"\u2197"}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="px-3 py-2 mb-4 rounded"
        style={{
          background: "rgba(200,160,100,0.08)",
          border: "1px solid rgba(200,160,100,0.2)",
        }}
      >
        <span className="text-[11px] text-[#c4956a]">
          Criteria must be published on-chain before reviewers can be assigned
        </span>
      </div>
      {criteria.map((c, i) => (
        <div
          key={i}
          className="flex justify-between items-center px-3 py-2.5 mb-1 rounded"
          style={{
            background: "rgba(30,28,24,0.4)",
            border: "1px solid rgba(120,110,95,0.08)",
          }}
        >
          <span className="text-xs text-[#b0a898]">{c.label}</span>
          <span className="text-[10px] text-[#6a6050]">{c.type}</span>
        </div>
      ))}
      <button
        className="mt-4 w-full py-2.5 rounded font-serif text-[13px] text-[#d4c8a8] cursor-pointer tracking-[0.5px]"
        style={{
          background: "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))",
          border: "1px solid rgba(180,160,120,0.4)",
        }}
      >
        Publish Criteria On-Chain
      </button>
    </div>
  );
}
