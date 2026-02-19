import type { PaperStatus } from "@/types/dashboard";

const statusStyles: Record<PaperStatus, { bg: string; text: string; border: string }> = {
  Published: { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
  "Under Review": { bg: "rgba(180,180,120,0.15)", text: "#c9b458", border: "rgba(180,180,120,0.3)" },
  "Contract Pending": { bg: "rgba(180,140,100,0.15)", text: "#c4956a", border: "rgba(180,140,100,0.3)" },
  "Revision Requested": { bg: "rgba(200,130,100,0.15)", text: "#d4845a", border: "rgba(200,130,100,0.3)" },
  Draft: { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
  Submitted: { bg: "rgba(130,160,200,0.15)", text: "#7a9fc7", border: "rgba(130,160,200,0.3)" },
};

export function StatusBadge({ status }: { status: PaperStatus }) {
  const c = statusStyles[status] || statusStyles.Draft;
  return (
    <span
      className="px-2.5 py-0.5 rounded-[3px] text-[11px] tracking-[0.5px] font-serif whitespace-nowrap"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {status}
    </span>
  );
}
