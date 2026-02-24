import type { ReviewCriterion } from "@/src/shared/types/review-workspace";

interface CriteriaSidebarProps {
  criteria: ReviewCriterion[];
  collapsed: boolean;
  onToggle: () => void;
}

export function CriteriaSidebar({ criteria, collapsed, onToggle }: CriteriaSidebarProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(145deg, rgba(45,42,38,0.9), rgba(35,32,28,0.9))",
        border: "1px solid rgba(120,110,95,0.25)",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-serif cursor-pointer"
        style={{
          background: "none",
          border: "none",
          borderBottom: collapsed ? "none" : "1px solid rgba(120,110,95,0.15)",
          color: "#c9a44a",
        }}
      >
        <span className="text-xs uppercase" style={{ letterSpacing: 1.5 }}>
          Journal Criteria
        </span>
        <span className="text-xs" style={{ color: "#6a6050" }}>
          {collapsed ? "\u25BC" : "\u25B2"}
        </span>
      </button>

      {!collapsed && (
        <div className="p-4 flex flex-col gap-3">
          <div className="text-xs italic mb-1" style={{ color: "#6a6050" }}>
            Pre-registered on-chain before review
          </div>
          {criteria.map((c, i) => (
            <div
              key={c.id}
              className="p-3 rounded"
              style={{ background: "rgba(30,28,24,0.5)" }}
            >
              <div className="text-sm mb-1" style={{ color: "#d4ccc0" }}>
                {i + 1}. {c.text}
              </div>
              <div
                className="text-xs truncate"
                style={{ color: "#4a4238", fontFamily: "monospace" }}
              >
                {c.onChainHash}
              </div>
            </div>
          ))}
          <div
            className="text-xs italic mt-1 px-1"
            style={{ color: "#4a4238" }}
          >
            If all criteria are met, journal has a binding publication obligation
          </div>
        </div>
      )}
    </div>
  );
}
