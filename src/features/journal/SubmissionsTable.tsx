import type { JournalSubmission, SubmissionStage, StageColorConfig } from "@/src/shared/types/journal-dashboard";
import { StageBadge } from "./StageBadge";

interface SubmissionsTableProps {
  submissions: JournalSubmission[];
  stageColors: Record<SubmissionStage, StageColorConfig>;
  selectedId: number | null;
  hoveredRow: number | null;
  onSelectSubmission: (id: number) => void;
  onHoverRow: (id: number | null) => void;
}

export function SubmissionsTable({
  submissions,
  stageColors,
  selectedId,
  hoveredRow,
  onSelectSubmission,
  onHoverRow,
}: SubmissionsTableProps) {
  return (
    <div
      className="rounded-[6px] overflow-hidden"
      style={{ border: "1px solid rgba(120,110,95,0.15)" }}
    >
      {/* Header */}
      <div
        className="grid px-4 py-3 text-[10px] text-[#6a6050] uppercase tracking-[1.5px]"
        style={{
          gridTemplateColumns: "2.2fr 1fr 0.7fr 0.8fr 0.6fr",
          background: "rgba(45,42,38,0.5)",
          borderBottom: "1px solid rgba(120,110,95,0.15)",
        }}
      >
        <span>Paper</span>
        <span>Authors</span>
        <span>Submitted</span>
        <span>Stage</span>
        <span>Reviewers</span>
      </div>

      {/* Rows */}
      {submissions.map((s, i) => (
        <div
          key={s.id}
          onClick={() => onSelectSubmission(s.id)}
          onMouseEnter={() => onHoverRow(s.id)}
          onMouseLeave={() => onHoverRow(null)}
          className="grid px-4 py-[13px] items-center cursor-pointer transition-all duration-200"
          style={{
            gridTemplateColumns: "2.2fr 1fr 0.7fr 0.8fr 0.6fr",
            background:
              selectedId === s.id
                ? "rgba(180,160,120,0.06)"
                : hoveredRow === s.id
                  ? "rgba(120,110,95,0.06)"
                  : "transparent",
            borderBottom: i < submissions.length - 1 ? "1px solid rgba(120,110,95,0.06)" : "none",
            borderLeft: selectedId === s.id ? "3px solid #c9b89e" : "3px solid transparent",
          }}
        >
          <span className="text-xs text-[#d4ccc0] leading-[1.4] pr-3 overflow-hidden text-ellipsis whitespace-nowrap">
            {s.title}
          </span>
          <span className="text-[11px] text-[#8a8070] overflow-hidden text-ellipsis whitespace-nowrap">
            {s.authors}
          </span>
          <span className="text-[11px] text-[#6a6050]">{s.submitted}</span>
          <span>
            <StageBadge stage={s.stage} colors={stageColors} />
          </span>
          <span className="text-[11px] text-[#6a6050]">
            {s.reviewers.length > 0 ? s.reviewers.length + " assigned" : "\u2014"}
          </span>
        </div>
      ))}
    </div>
  );
}
