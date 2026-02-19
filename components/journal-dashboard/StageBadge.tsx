import type { SubmissionStage, StageColorConfig } from "@/types/journal-dashboard";
import { Badge } from "@/components/shared";

interface StageBadgeProps {
  stage: SubmissionStage;
  colors: Record<SubmissionStage, StageColorConfig>;
}

export function StageBadge({ stage, colors }: StageBadgeProps) {
  const c = colors[stage];
  return <Badge label={stage} colors={c} />;
}
