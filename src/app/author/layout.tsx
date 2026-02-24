import { redirect } from "next/navigation";
import { RoleShell } from "@/src/shared/components";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getUserByWallet } from "@/src/features/users/queries";
import { mockUser } from "@/src/features/author/mock-data/dashboard";
import { navItems } from "@/src/features/author/nav";
import { truncateWallet, getInitials } from "@/src/shared/lib/format";
import type { UserProfile } from "@/src/shared/types/shared";

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = await getSession();
  if (!wallet) redirect("/login");

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
