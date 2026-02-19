import type { ReviewStatus } from "@/types/reviewer-dashboard";

const statusStyles: Record<ReviewStatus, { bg: string; text: string; border: string }> = {
  Late: { bg: "rgba(200,100,90,0.15)", text: "#d4645a", border: "rgba(200,100,90,0.3)" },
  "In Progress": { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
  Pending: { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
  Submitted: { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const c = statusStyles[status] || statusStyles.Pending;
  return (
    <span
      className="px-2.5 py-0.5 rounded-[3px] text-[11px] tracking-[0.5px] font-serif whitespace-nowrap"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {status}
    </span>
  );
}
