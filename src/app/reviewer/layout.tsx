import { RoleShell } from "@/src/shared/components";
import { reviewerNavItems, mockReviewerUser } from "@/src/shared/lib/mock-data/reviewer-dashboard";

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell navItems={reviewerNavItems} user={mockReviewerUser}>
      {children}
    </RoleShell>
  );
}
