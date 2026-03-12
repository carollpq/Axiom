// Editor role guard + shell wrapper.
// Validates the current user has the "editor" role before rendering children.
// Redirects to the user's first available role dashboard (or login) on mismatch.

import { redirect } from 'next/navigation';
import { RoleShell } from '@/src/shared/components';
import { getSession } from '@/src/shared/lib/auth/auth';
import { getUserByWallet } from '@/src/features/users/queries';
import { journalNavItems } from '@/src/features/editor/nav';
import { buildUserProfile } from '@/src/features/users/lib';
import { ROUTES, ROLE_DASHBOARD_ROUTES } from '@/src/shared/lib/routes';

export default async function JournalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = (await getSession())!;
  const user = await getUserByWallet(wallet);

  if (!user?.roles?.includes('editor')) {
    const fallbackRole = user?.roles?.[0];
    if (fallbackRole && fallbackRole in ROLE_DASHBOARD_ROUTES) {
      redirect(ROLE_DASHBOARD_ROUTES[fallbackRole]);
    }
    redirect(ROUTES.login);
  }

  const profile = buildUserProfile(wallet, user, 'editor');

  return (
    <RoleShell navItems={journalNavItems} user={profile}>
      {children}
    </RoleShell>
  );
}
