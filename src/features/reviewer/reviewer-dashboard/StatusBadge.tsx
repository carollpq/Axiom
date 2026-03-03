import type { ReviewStatus } from "@/src/features/reviewer/types";
import type { BadgeColorConfig } from "@/src/shared/types/shared";
import { Badge } from "@/src/shared/components";

const statusStyles: Record<ReviewStatus, BadgeColorConfig> = {
  Late: { bg: "rgba(200,100,90,0.15)", text: "#d4645a", border: "rgba(200,100,90,0.3)" },
  "In Progress": { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
  Pending: { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
  Submitted: { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const c = statusStyles[status] || statusStyles.Pending;
  return <Badge label={status} colors={c} />;
}
