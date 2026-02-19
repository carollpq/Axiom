import type {
  SubmissionStage,
  StageColorConfig,
  StageFilter,
  PipelineCounts,
} from "@/types/journal-dashboard";

interface PipelineSummaryProps {
  pipelineCounts: PipelineCounts;
  stages: SubmissionStage[];
  stageColors: Record<SubmissionStage, StageColorConfig>;
  activeFilter: StageFilter;
  onToggleFilter: (stage: SubmissionStage) => void;
}

export function PipelineSummary({
  pipelineCounts,
  stages,
  stageColors,
  activeFilter,
  onToggleFilter,
}: PipelineSummaryProps) {
  return (
    <div
      className="flex gap-0.5 mb-8 px-5 py-4 rounded-[6px]"
      style={{
        background: "rgba(45,42,38,0.5)",
        border: "1px solid rgba(120,110,95,0.15)",
      }}
    >
      {stages.map((st) => {
        const c = stageColors[st];
        const count = pipelineCounts[st];
        return (
          <div
            key={st}
            onClick={() => onToggleFilter(st)}
            className="flex-1 text-center py-2.5 px-1 cursor-pointer rounded transition-colors duration-200"
            style={{
              background: activeFilter === st ? "rgba(120,110,95,0.15)" : "transparent",
            }}
          >
            <div className="text-[20px] font-serif" style={{ color: c.text }}>
              {count}
            </div>
            <div className="text-[9px] text-[#6a6050] uppercase tracking-[0.8px] mt-1 leading-tight">
              {st}
            </div>
          </div>
        );
      })}
    </div>
  );
}
