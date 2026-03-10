import type {
  ReviewerWithStatus,
  AssignmentDisplayStatus,
} from '@/src/features/editor/types';
import { getStatusColors } from '@/src/shared/lib/status-colors';
import { SidebarSection } from '@/src/shared/components/sidebar-section';
import { ListRow } from '@/src/shared/components/list-row';

const statusLabels: Record<AssignmentDisplayStatus, string> = {
  complete: 'Complete',
  in_progress: 'In Progress',
  rejected: 'Rejected',
  pending: 'Pending',
};

interface ReviewStatusPanelProps {
  reviewers: ReviewerWithStatus[];
}

export function ReviewStatusPanel({ reviewers }: ReviewStatusPanelProps) {
  return (
    <SidebarSection title="Review Status">
      <div className="space-y-2">
        {reviewers.map((r) => {
          const label = statusLabels[r.status];
          const c = getStatusColors(label);
          return (
            <ListRow key={r.id}>
              <span className="text-[12px] text-[#d4ccc0] font-serif truncate min-w-0">
                {r.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm"
                  style={{
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    color: c.text,
                  }}
                >
                  {label}
                </span>
                {r.hasComment && (
                  <button className="text-[10px] text-[#8a8070] hover:text-[#c9b89e] cursor-pointer">
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
