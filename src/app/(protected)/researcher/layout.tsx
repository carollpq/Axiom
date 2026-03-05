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
  // TODO: Deduplicate getSession() — parent (protected)/layout.tsx already calls it.
  // Wrap in React cache() so the JWT is only parsed once per request.
  const wallet = (await getSession())!;
  const user = await getUserByWallet(wallet);
  const profile = buildUserProfile(wallet, user, "researcher");

  return (
    <RoleShell navItems={navItems} user={profile}>
      {children}
    </RoleShell>
  );
}
