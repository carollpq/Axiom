import { Badge } from "@/components/shared/Badge";
import { getStatusColors } from "@/lib/status-colors";

export function StatusBadge({ status }: { status: string }) {
  return <Badge label={status} colors={getStatusColors(status)} />;
}
