import type { ReviewerWithStatus } from "@/src/features/editor/types";
import { SidebarSection } from "@/src/shared/components/SidebarSection";
import { ListRow } from "@/src/shared/components/ListRow";

interface ReviewCommentsPanelProps {
  reviewers: ReviewerWithStatus[];
}

export function ReviewCommentsPanel({ reviewers }: ReviewCommentsPanelProps) {
  return (
    <SidebarSection title="Reviews">
      <div className="space-y-2">
        {reviewers.map((r) => (
          <ListRow key={r.id} variant="gold">
            <span className="text-[12px] text-[#d4ccc0] font-serif">
              {r.name}
            </span>
            <button
              className="text-[10px] px-2 py-0.5 rounded-sm cursor-pointer"
              style={{
                background: "rgba(180,160,120,0.15)",
                border: "1px solid rgba(180,160,120,0.3)",
                color: "#c9a44a",
              }}
            >
              See comment...
            </button>
          </ListRow>
        ))}
      </div>
    </SidebarSection>
  );
}
