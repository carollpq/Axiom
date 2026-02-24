import { RoleShell } from "@/components/shared";
import { getSession } from "@/lib/auth";
import { getUserByWallet } from "@/features/users";
import { mockUser } from "@/lib/mock-data/dashboard";
import { navItems } from "@/lib/nav";
import { truncateWallet, getInitials } from "@/lib/format";
import type { UserProfile } from "@/types/shared";

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = await getSession();

  let profile: UserProfile;
  if (wallet) {
    const user = getUserByWallet(wallet);
    profile = user
      ? {
          name: user.displayName ?? truncateWallet(user.walletAddress),
          initials: getInitials(user.displayName ?? user.walletAddress),
          wallet: truncateWallet(user.walletAddress),
          role: "Author",
          notificationCount: 0,
        }
      : mockUser;
  } else {
    profile = mockUser;
  }

  return (
    <RoleShell navItems={navItems} user={profile}>
      {children}
    </RoleShell>
  );
}
