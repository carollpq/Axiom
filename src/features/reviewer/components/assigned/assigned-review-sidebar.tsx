import Link from "next/link";
import type { AssignedReviewExtended } from "@/src/features/reviewer/types";

interface AssignedReviewSidebarProps {
  paper: AssignedReviewExtended;
}

function getUrgencyColor(daysLeft: number): string {
  if (daysLeft < 0) return "#d4645a";
  if (daysLeft <= 3) return "#c9a44a";
  return "#8fbc8f";
}

export function AssignedReviewSidebar({ paper }: AssignedReviewSidebarProps) {
  const urgencyColor = getUrgencyColor(paper.daysLeft);

  return (
    <div className="p-4 space-y-6">
      {/* Journal */}
      <div>
        <div className="text-[10px] uppercase tracking-[1.5px] mb-2" style={{ color: "#6a6050" }}>
          Journal
        </div>
        <div className="text-sm font-serif" style={{ color: "#d4ccc0" }}>
          {paper.journal}
        </div>
      </div>

      {/* Editor */}
      <div>
        <div className="text-[10px] uppercase tracking-[1.5px] mb-2" style={{ color: "#6a6050" }}>
          Editor
        </div>
        <div className="text-sm" style={{ color: "#b0a898" }}>
          {paper.editorName}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <div className="text-[10px] uppercase tracking-[1.5px] mb-3" style={{ color: "#6a6050" }}>
          Timeline
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[12px]">
            <span style={{ color: "#8a8070" }}>Assigned</span>
            <span style={{ color: "#b0a898" }}>{paper.assigned}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span style={{ color: "#8a8070" }}>Deadline</span>
            <span style={{ color: "#b0a898" }}>{paper.deadline}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span style={{ color: "#8a8070" }}>Days remaining</span>
            <span className="font-bold" style={{ color: urgencyColor }}>
              {paper.daysLeft < 0 ? `${Math.abs(paper.daysLeft)} days overdue` : `${paper.daysLeft} days`}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <div className="text-[10px] uppercase tracking-[1.5px] mb-2" style={{ color: "#6a6050" }}>
          Status
        </div>
        <span
          className="inline-block text-[11px] px-2 py-1 rounded"
          style={{
            backgroundColor: `${urgencyColor}20`,
            color: urgencyColor,
          }}
        >
          {paper.status}
        </span>
      </div>

      {/* Open Review Button */}
      {paper.assignmentId && (
        <Link
          href={`/reviewer/review_workspace/${paper.assignmentId}`}
          className="block w-full text-center rounded px-4 py-3 text-sm font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: "#c9a44a",
            color: "#1a1816",
          }}
        >
          Open Review
        </Link>
      )}
    </div>
  );
}
