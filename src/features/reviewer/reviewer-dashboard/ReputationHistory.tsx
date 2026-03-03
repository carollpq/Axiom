import type { ReputationDataPoint } from "@/src/features/reviewer/types";

interface ReputationHistoryProps {
  history: ReputationDataPoint[];
  expanded: boolean;
  onToggle: () => void;
}

export function ReputationHistory({ history, expanded, onToggle }: ReputationHistoryProps) {
  return (
    <>
      <button
        onClick={onToggle}
        className="bg-transparent border-none text-[#8a8070] text-[11px] cursor-pointer font-serif mt-4 p-0 italic"
      >
        {expanded ? "Hide" : "View"} full reputation history {expanded ? "\u25B2" : "\u25BC"}
      </button>

      {expanded && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(120,110,95,0.15)" }}>
          <div className="flex gap-3 flex-wrap">
            {history.map((h) => (
              <div
                key={h.month}
                className="px-3.5 py-1.5 rounded text-xs"
                style={{ background: "rgba(120,110,95,0.08)" }}
              >
                <span className="text-[#6a6050]">{h.month}: </span>
                <span className="text-[#c9b89e]">{h.score.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-[#4a4238] mt-2 italic">
            All reputation records are append-only and publicly verifiable on Hedera
          </div>
        </div>
      )}
    </>
  );
}
