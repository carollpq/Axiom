import { SidebarSection } from '@/src/shared/components/sidebar-section';

export function WaitingForReviewsPanel() {
  return (
    <SidebarSection title="Editorial Decision">
      <p className="text-[12px] text-[#6a6050] font-serif italic">
        Waiting for all reviews to be completed before a decision can be made.
      </p>
    </SidebarSection>
  );
}
