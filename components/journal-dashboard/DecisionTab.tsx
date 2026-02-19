import type { JournalSubmission } from "@/types/journal-dashboard";

interface DecisionTabProps {
  submission: JournalSubmission;
}

export function DecisionTab({ submission }: DecisionTabProps) {
  if (submission.stage === "Published") {
    return (
      <div
        className="p-4 rounded-[6px] text-center"
        style={{
          background: "rgba(120,180,120,0.08)",
          border: "1px solid rgba(120,180,120,0.2)",
        }}
      >
        <div className="text-sm text-[#8fbc8f] mb-1">{"\u2713"} Published</div>
        <div className="text-[11px] text-[#6a6050]">
          This paper has been accepted and published on-chain
        </div>
      </div>
    );
  }

  if (submission.stage === "Rejected") {
    return (
      <div
        className="p-4 rounded-[6px]"
        style={{
          background: "rgba(200,100,90,0.08)",
          border: "1px solid rgba(200,100,90,0.2)",
        }}
      >
        <div className="text-sm text-[#d4645a] mb-1">{"\u2715"} Rejected</div>
        <div className="text-[11px] text-[#6a6050]">On-chain justification recorded</div>
      </div>
    );
  }

  if (submission.stage === "Decision Pending" && submission.criteriaMet) {
    return (
      <div>
        <div
          className="px-4 py-3 mb-4 rounded-[6px]"
          style={{
            background: "rgba(180,160,120,0.1)",
            border: "1px solid rgba(180,160,120,0.3)",
          }}
        >
          <div className="text-xs text-[#d4c8a8] font-semibold mb-1">All criteria met</div>
          <div className="text-[11px] text-[#8a8070]">
            Journal is contractually bound to publish this paper per the pre-registered review
            criteria.
          </div>
        </div>
        <button
          className="w-full py-3 mb-2 rounded font-serif text-[13px] text-[#8fbc8f] cursor-pointer"
          style={{
            background: "linear-gradient(135deg, rgba(120,180,120,0.25), rgba(100,160,100,0.15))",
            border: "1px solid rgba(120,180,120,0.4)",
          }}
        >
          Publish Paper
        </button>
        <div className="text-center py-2">
          <span className="text-[10px] text-[#6a6050]">or</span>
        </div>
        <button
          className="w-full py-2.5 bg-transparent rounded font-serif text-xs text-[#d4645a] cursor-pointer"
          style={{ border: "1px solid rgba(200,100,90,0.3)" }}
        >
          Reject with Public Justification
        </button>
        <div className="text-[10px] text-[#d4645a] mt-1.5 italic text-center">
          Warning: Rejecting after criteria are met requires detailed public justification and
          impacts journal reputation
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 text-center text-[#6a6050] italic text-xs">
      Decision available after all reviews are submitted
    </div>
  );
}
