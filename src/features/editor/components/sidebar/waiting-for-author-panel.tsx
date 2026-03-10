import { SidebarSection } from '@/src/shared/components/sidebar-section';
import type { AuthorResponseStatusDb } from '@/src/shared/lib/db/schema';

const authorStatusLabels: Record<
  AuthorResponseStatusDb,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: 'Pending',
    color: '#9a9aad',
    bg: 'rgba(150,150,170,0.15)',
    border: 'rgba(150,150,170,0.3)',
  },
  accepted: {
    label: 'Accepted Reviews',
    color: '#8fbc8f',
    bg: 'rgba(120,180,120,0.15)',
    border: 'rgba(120,180,120,0.3)',
  },
  rebuttal_requested: {
    label: 'Rebuttal Requested',
    color: '#c9a44a',
    bg: 'rgba(180,160,120,0.15)',
    border: 'rgba(180,160,120,0.3)',
  },
};

interface WaitingForAuthorPanelProps {
  authorResponseStatus: AuthorResponseStatusDb | null;
}

export function WaitingForAuthorPanel({
  authorResponseStatus,
}: WaitingForAuthorPanelProps) {
  const statusInfo = authorStatusLabels[authorResponseStatus ?? 'pending'];

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
            color: statusInfo.color,
          }}
        >
          {statusInfo.label}
        </div>
        <p className="text-[10px] text-[#6a6050] mt-1.5 italic">
          Waiting for author to respond to reviews before final decision can be
          made.
        </p>
      </div>
    </SidebarSection>
  );
}
