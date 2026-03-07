"use client";

import type { NavItemData, UserProfile } from "@/src/shared/types/shared";
import { SidebarProvider, useSidebar, SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from "@/src/shared/context/SidebarContext";
import { Sidebar } from "./Sidebar.client";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";

interface RoleShellProps {
  navItems: NavItemData[];
  user: UserProfile;
  children: React.ReactNode;
}

function ShellInner({ navItems, user, children }: RoleShellProps) {
  const { collapsed } = useSidebar();
  const marginLeft = collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED;

  return (
    <div
      className="min-h-screen overflow-x-hidden text-[#d4ccc0] font-serif"
      style={{
        background: "#1a1816",
        backgroundImage:
          "radial-gradient(ellipse at 20% 0%, rgba(60,55,45,0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(50,45,35,0.2) 0%, transparent 50%)",
      }}
    >
      <Sidebar navItems={navItems} user={user} />
      <div
        style={{
          marginLeft,
          transition: "margin-left 200ms ease-in-out",
        }}
      >
        <TopBar />
        {children}
        <Footer />
      </div>
    </div>
  );
}

export function RoleShell(props: RoleShellProps) {
  return (
    <SidebarProvider>
      <ShellInner {...props} />
    </SidebarProvider>
  );
}
