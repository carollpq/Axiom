import { RoleShell } from "@/components/shared";
import { getSession } from "@/lib/auth";
import { getUserByWallet } from "@/features/users/queries";
import { mockUser } from "@/features/author/mock-data/dashboard";
import { navItems } from "@/features/author/nav";
import { truncateWallet, getInitials } from "@/lib/format";
import type { UserProfile } from "@/src/shared/types/shared";

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = await getSession();

  let profile: UserProfile;
  if (wallet) {
    const user = await getUserByWallet(wallet);
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
