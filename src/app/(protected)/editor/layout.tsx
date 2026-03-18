// Editor role guard + shell wrapper.
// Validates the current user has the "editor" role before rendering children.
// Redirects to the user's first available role dashboard (or login) on mismatch.

import { redirect } from 'next/navigation';
import { RoleShell } from '@/src/shared/components';
import { getSession } from '@/src/shared/lib/auth/auth';
import { getUserByWallet } from '@/src/features/users/queries';
import {
  journalNavItems,
  buildEditorNavItems,
} from '@/src/features/editor/nav';
import { buildUserProfile } from '@/src/features/users/lib';
import { ROUTES, ROLE_DASHBOARD_ROUTES } from '@/src/shared/lib/routes';
import {
  getJournalByEditorWallet,
  getEditorNavCounts,
} from '@/src/features/editor/queries';

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

  const journal = await getJournalByEditorWallet(wallet);
  const navItems = journal
    ? buildEditorNavItems(await getEditorNavCounts(journal.id))
    : journalNavItems;

  return (
    <RoleShell navItems={navItems} user={profile}>
      {children}
    </RoleShell>
  );
}
