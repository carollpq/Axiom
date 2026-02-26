"use client";

interface FinalDecisionPanelProps {
  comment: string;
  onCommentChange: (v: string) => void;
  decision: string;
  onDecisionChange: (v: string) => void;
  onRelease: () => void;
}

export function FinalDecisionPanel({
  comment,
  onCommentChange,
  decision,
  onDecisionChange,
  onRelease,
}: FinalDecisionPanelProps) {
  return (
    <div
      className="p-4"
      style={{ borderBottom: "1px solid rgba(120,110,95,0.1)" }}
    >
      <textarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Add your comment..."
        rows={3}
        className="w-full rounded-[6px] p-3 text-[12px] font-serif text-[#d4ccc0] outline-none resize-none mb-3"
        style={{
          background: "rgba(30,28,24,0.6)",
          border: "1px solid rgba(120,110,95,0.2)",
        }}
      />

      <div className="flex items-center gap-2">
        <select
          value={decision}
          onChange={(e) => onDecisionChange(e.target.value)}
          className="flex-1 rounded-[6px] px-3 py-2 text-[12px] font-serif text-[#d4ccc0] outline-none cursor-pointer"
          style={{
            background: "rgba(30,28,24,0.6)",
            border: "1px solid rgba(120,110,95,0.2)",
            appearance: "none",
          }}
        >
          <option value="">Final Decision</option>
          <option value="accept">Accept</option>
          <option value="reject">Reject</option>
          <option value="revise">Request Revision</option>
        </select>

        <button
          onClick={onRelease}
          className="px-4 py-2 rounded text-[12px] font-serif cursor-pointer whitespace-nowrap"
          style={{
            background:
              "linear-gradient(135deg, rgba(180,160,120,0.25), rgba(160,140,100,0.15))",
            border: "1px solid rgba(180,160,120,0.4)",
            color: "#d4c8a8",
          }}
        >
          Release to Author
        </button>
      </div>
    </div>
  );
}
