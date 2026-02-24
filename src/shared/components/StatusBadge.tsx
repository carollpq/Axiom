import { Badge } from "@/src/shared/components/Badge";
import { getStatusColors } from "@/src/shared/lib/status-colors";

export function StatusBadge({ status }: { status: string }) {
  return <Badge label={status} colors={getStatusColors(status)} />;
}
