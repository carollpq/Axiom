import { RoleShell } from "@/src/shared/components";
import { reviewerNavItems } from "@/src/features/reviewer/nav";
import type { UserProfile } from "@/src/shared/types/shared";

const reviewerUser: UserProfile = {
  name: "Dr. K. Tanaka",
  initials: "KT",
  wallet: "—",
  role: "Reviewer",
  notificationCount: 0,
};

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell navItems={reviewerNavItems} user={reviewerUser}>
      {children}
    </RoleShell>
  );
}
