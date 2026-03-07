import type { ReviewerDisplayStatus } from "@/src/features/reviewer/types";
import { getStatusColors } from "@/src/shared/lib/status-colors";
import { Badge } from "@/src/shared/components";

export function StatusBadge({ status }: { status: ReviewerDisplayStatus }) {
  const c = getStatusColors(status);
  return <Badge label={status} colors={c} />;
}
