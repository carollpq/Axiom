import { statusColors } from "@/lib/mock-data/explorer";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = statusColors[status] || statusColors["Draft"];
  return (
    <span
      className="py-0.5 px-2.5 rounded-sm text-[11px] tracking-[0.5px] font-serif whitespace-nowrap"
      style={{ background: c.bg, color: c.text, border: "1px solid " + c.border }}
    >{status}</span>
  );
}
