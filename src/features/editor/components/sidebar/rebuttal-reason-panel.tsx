'use client';

import { SidebarSection } from '@/src/shared/components/sidebar-section';

interface RebuttalReasonPanelProps {
  authorReason: string | null;
  status: 'open' | 'submitted' | 'under_review' | 'resolved';
}

export function RebuttalReasonPanel({
  authorReason,
  status,
}: RebuttalReasonPanelProps) {
  if (!authorReason) {
    return (
      <SidebarSection title="Rebuttal Reason">
        <p className="text-[12px] text-[#6a6050] italic">
          No reason provided by author.
        </p>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection title="Rebuttal Reason">
      <div className="mb-2">
        <p className="text-[10px] text-[#6a6050] uppercase tracking-[1px] mb-2">
          Author Comment
        </p>
        <div
          className="text-[12px] text-[#d4ccc0] rounded-md p-3 max-h-[200px] overflow-y-auto font-serif"
          style={{
            background: 'rgba(45,42,38,0.4)',
            border: '1px solid rgba(120,110,95,0.15)',
          }}
        >
          {authorReason}
        </div>
      </div>
      <p className="text-[10px] text-[#6a6050] italic mt-2">
        Status: <span className="capitalize">{status}</span>
      </p>
    </SidebarSection>
  );
}
