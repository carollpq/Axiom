import type { SubmissionStage, StageColorConfig } from "@/types/journal-dashboard";

interface StageBadgeProps {
  stage: SubmissionStage;
  colors: Record<SubmissionStage, StageColorConfig>;
}

export function StageBadge({ stage, colors }: StageBadgeProps) {
  const c = colors[stage];
  return (
    <span
      className="py-[3px] px-2.5 rounded-[3px] text-[11px] tracking-[0.5px] font-serif whitespace-nowrap"
      style={{
        background: c.bg,
        color: c.text,
        border: "1px solid " + c.border,
      }}
    >
      {stage}
    </span>
  );
}
