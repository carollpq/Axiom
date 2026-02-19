import { RoleShell } from "@/components/shared";
import { reviewerNavItems, mockReviewerUser } from "@/lib/mock-data/reviewer-dashboard";

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell navItems={reviewerNavItems} user={mockReviewerUser}>
      {children}
    </RoleShell>
  );
}
