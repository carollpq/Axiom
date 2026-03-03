import type { SubmissionStage, StageColorConfig } from "@/src/features/editor/types";
import { Badge } from "@/src/shared/components";

interface StageBadgeProps {
  stage: SubmissionStage;
  colors: Record<SubmissionStage, StageColorConfig>;
}

export function StageBadge({ stage, colors }: StageBadgeProps) {
  const c = colors[stage];
  return <Badge label={stage} colors={c} />;
}
