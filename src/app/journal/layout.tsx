import { RoleShell } from "@/src/shared/components";
import { journalNavItems, mockJournalUser } from "@/src/shared/lib/mock-data/journal-dashboard";

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell navItems={journalNavItems} user={mockJournalUser}>
      {children}
    </RoleShell>
  );
}
