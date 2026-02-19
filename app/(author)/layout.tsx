import { RoleShell } from "@/components/shared";
import { navItems, mockUser } from "@/lib/mock-data/dashboard";

export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleShell navItems={navItems} user={mockUser}>
      {children}
    </RoleShell>
  );
}
