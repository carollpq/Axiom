import { RoleShell } from "@/components/shared";
import { journalNavItems, mockJournalUser } from "@/lib/mock-data/journal-dashboard";

export default function JournalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell navItems={journalNavItems} user={mockJournalUser}>
      {children}
    </RoleShell>
  );
}
