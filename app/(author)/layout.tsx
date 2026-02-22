"use client";

import { RoleShell } from "@/components/shared";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { navItems, mockUser } from "@/lib/mock-data/dashboard";
import { truncateWallet, getInitials } from "@/lib/format";
import type { UserProfile } from "@/types/shared";

export default function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isConnected } = useCurrentUser();

  const profile: UserProfile = user
    ? {
        name: user.displayName ?? truncateWallet(user.walletAddress),
        initials: getInitials(user.displayName ?? user.walletAddress),
        wallet: truncateWallet(user.walletAddress),
        role: "Author",
        notificationCount: 0,
      }
    : mockUser;

  return (
    <RoleShell navItems={navItems} user={profile}>
      {children}
    </RoleShell>
  );
}
