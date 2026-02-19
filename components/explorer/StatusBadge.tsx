import { statusColors } from "@/lib/mock-data/explorer";
import { Badge } from "@/components/shared";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = statusColors[status] || statusColors["Draft"];
  return <Badge label={status} colors={c} />;
}
