import { RoleShell } from '@/src/shared/components';
import { getSession } from '@/src/shared/lib/auth/auth';
import { getUserByWallet } from '@/src/features/users/queries';
import { journalNavItems } from '@/src/features/editor/nav';
import { buildUserProfile } from '@/src/shared/lib/format';

export default async function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = (await getSession())!;
  const user = await getUserByWallet(wallet);
  const profile = buildUserProfile(wallet, user, 'editor');

  return (
    <RoleShell navItems={journalNavItems} user={profile}>
      {children}
    </RoleShell>
  );
}
