import { RoleShell } from "@/src/shared/components";
import { getSession } from "@/src/shared/lib/auth/auth";
import { getUserByWallet } from "@/src/features/users/queries";
import { reviewerNavItems } from "@/src/features/reviewer/nav";
import { buildUserProfile } from "@/src/shared/lib/format";

export default async function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const wallet = (await getSession())!;
  const user = await getUserByWallet(wallet);
  const profile = buildUserProfile(wallet, user, "reviewer");

  return (
    <RoleShell navItems={reviewerNavItems} user={profile}>
      {children}
    </RoleShell>
  );
}
