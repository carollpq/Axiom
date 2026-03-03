import type { SubmissionStage, BadgeColorConfig } from "@/src/features/editor/types";
import { Badge } from "@/src/shared/components";

interface StageBadgeProps {
  stage: SubmissionStage;
  colors: Record<SubmissionStage, BadgeColorConfig>;
}

export function StageBadge({ stage, colors }: StageBadgeProps) {
  const c = colors[stage];
  return <Badge label={stage} colors={c} />;
}
