import { RoleShell } from "@/src/shared/components";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getUserByWallet } from "@/src/features/users/queries";
import { navItems } from "@/src/features/researcher/nav";
import { truncateWallet, getInitials } from "@/src/shared/lib/format";
import type { UserProfile } from "@/src/shared/types/shared";

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // wallet is guaranteed non-null by (protected)/layout.tsx
  const wallet = (await getSession())!;

  const user = await getUserByWallet(wallet);
  const profile: UserProfile = user
    ? {
        name: user.displayName ?? truncateWallet(user.walletAddress),
        initials: getInitials(user.displayName ?? user.walletAddress),
        wallet: truncateWallet(user.walletAddress),
        role: "Researcher",
        notificationCount: 0,
      }
    : {
        name: truncateWallet(wallet),
        initials: getInitials(wallet),
        wallet: truncateWallet(wallet),
        role: "Researcher",
        notificationCount: 0,
      };

  return (
    <RoleShell navItems={navItems} user={profile}>
      {children}
    </RoleShell>
  );
}
