import { SidebarSection } from '@/src/shared/components/sidebar-section';
import {
  getStatusColors,
  authorStatusLabels,
} from '@/src/shared/lib/status-colors';
import type { AuthorResponseStatusDb } from '@/src/shared/lib/db/schema';

interface WaitingForAuthorPanelProps {
  authorResponseStatus: AuthorResponseStatusDb | null;
}

export function WaitingForAuthorPanel({
  authorResponseStatus,
}: WaitingForAuthorPanelProps) {
  const label = authorStatusLabels[authorResponseStatus ?? 'pending'];
  const statusInfo = getStatusColors(label);

  return (
    <SidebarSection title="Editorial Decision">
      <div className="mb-3">
        <div className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-1.5">
          Author Status
        </div>
        <div
          className="text-[11px] px-3 py-1.5 rounded inline-block font-serif"
          style={{
            background: statusInfo.bg,
            border: `1px solid ${statusInfo.border}`,
            color: statusInfo.text,
          }}
        >
          {label}
        </div>
        <p className="text-[10px] text-[#6a6050] mt-1.5 italic">
          Waiting for author to respond to reviews before final decision can be
          made.
        </p>
      </div>
    </SidebarSection>
  );
}
