import type { ReviewerWithStatus, AssignmentDisplayStatus } from "@/src/features/editor/types";
import { SidebarSection } from "@/src/shared/components/SidebarSection";
import { ListRow } from "@/src/shared/components/ListRow";

const statusColors: Record<AssignmentDisplayStatus, { bg: string; text: string; border: string }> = {
  complete:    { bg: "rgba(120,180,120,0.15)", text: "#8fbc8f", border: "rgba(120,180,120,0.3)" },
  in_progress: { bg: "rgba(180,180,120,0.15)", text: "#c9b458", border: "rgba(180,180,120,0.3)" },
  rejected:    { bg: "rgba(200,100,90,0.15)",  text: "#d4645a", border: "rgba(200,100,90,0.3)" },
  pending:     { bg: "rgba(150,150,170,0.15)", text: "#9a9aad", border: "rgba(150,150,170,0.3)" },
};

const statusLabels: Record<AssignmentDisplayStatus, string> = {
  complete: "Complete",
  in_progress: "In Progress",
  rejected: "Rejected",
  pending: "Pending",
};

interface ReviewStatusPanelProps {
  reviewers: ReviewerWithStatus[];
}

export function ReviewStatusPanel({ reviewers }: ReviewStatusPanelProps) {
  return (
    <SidebarSection title="Review Status">
      <div className="space-y-2">
        {reviewers.map((r) => {
          const c = statusColors[r.status];
          return (
            <ListRow key={r.id}>
              <span className="text-[12px] text-[#d4ccc0] font-serif">
                {r.name}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm"
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                  }}
                >
                  {statusLabels[r.status]}
                </span>
                {r.hasComment && (
                  <button
                    className="text-[10px] text-[#8a8070] hover:text-[#c9b89e] cursor-pointer"
                  >
                    See comment...
                  </button>
                )}
              </div>
            </ListRow>
          );
        })}
      </div>
    </SidebarSection>
  );
}
