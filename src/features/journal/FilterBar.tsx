import type { StageFilter, ViewMode } from "@/src/shared/types/journal-dashboard";

interface FilterBarProps {
  stages: StageFilter[];
  activeFilter: StageFilter;
  onFilterChange: (stage: StageFilter) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function FilterBar({
  stages,
  activeFilter,
  onFilterChange,
  viewMode,
  onViewModeChange,
}: FilterBarProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-1.5 flex-wrap">
        {stages.map((s) => (
          <button
            key={s}
            onClick={() => onFilterChange(s)}
            className="rounded-[3px] py-[5px] px-3 text-[11px] font-serif cursor-pointer transition-all duration-300"
            style={{
              background: activeFilter === s ? "rgba(180,160,120,0.15)" : "transparent",
              border: "1px solid " + (activeFilter === s ? "rgba(180,160,120,0.3)" : "rgba(120,110,95,0.15)"),
              color: activeFilter === s ? "#c9b89e" : "#6a6050",
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {(["table", "kanban"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onViewModeChange(m)}
            className="rounded-[3px] py-[5px] px-2.5 text-[11px] font-serif cursor-pointer capitalize"
            style={{
              background: viewMode === m ? "rgba(120,110,95,0.2)" : "transparent",
              border: "1px solid rgba(120,110,95,0.15)",
              color: viewMode === m ? "#c9b89e" : "#6a6050",
            }}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
