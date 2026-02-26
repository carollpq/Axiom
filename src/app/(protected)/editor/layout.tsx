import { RoleShell } from "@/src/shared/components";
import { journalNavItems } from "@/src/features/editor/nav";
import type { UserProfile } from "@/src/shared/types/shared";

const journalUser: UserProfile = {
  name: "Journal of Computational Research",
  initials: "JC",
  wallet: "—",
  role: "Editor",
  notificationCount: 0,
};

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell navItems={journalNavItems} user={journalUser}>
      {children}
    </RoleShell>
  );
}
