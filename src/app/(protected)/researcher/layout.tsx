import { RoleShell } from "@/src/shared/components";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getUserByWallet } from "@/src/features/users/queries";
import { navItems } from "@/src/features/researcher/nav";
import { buildUserProfile } from "@/src/shared/lib/format";

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = (await getSession())!;
  const user = await getUserByWallet(wallet);
  const profile = buildUserProfile(wallet, user, "researcher");

  return (
    <RoleShell navItems={navItems} user={profile}>
      {children}
    </RoleShell>
  );
}
