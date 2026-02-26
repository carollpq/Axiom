import type { SubmissionStage, StageColorConfig } from "@/src/shared/types/editor-dashboard";
import { Badge } from "@/src/shared/components";

interface StageBadgeProps {
  stage: SubmissionStage;
  colors: Record<SubmissionStage, StageColorConfig>;
}

export function StageBadge({ stage, colors }: StageBadgeProps) {
  const c = colors[stage];
  return <Badge label={stage} colors={c} />;
}
