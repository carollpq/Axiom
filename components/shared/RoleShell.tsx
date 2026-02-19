import type { NavItemData, UserProfile } from "@/types/shared";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";

interface RoleShellProps {
  navItems: NavItemData[];
  user: UserProfile;
  children: React.ReactNode;
}

export function RoleShell({ navItems, user, children }: RoleShellProps) {
  return (
    <div
      className="min-h-screen text-[#d4ccc0] font-serif"
      style={{
        background: "#1a1816",
        backgroundImage:
          "radial-gradient(ellipse at 20% 0%, rgba(60,55,45,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(50,45,35,0.2) 0%, transparent 50%)",
      }}
    >
      <TopBar navItems={navItems} user={user} />
      {children}
      <Footer />
    </div>
  );
}
