import { redirect } from 'next/navigation';
import { RoleShell } from '@/src/shared/components';
import { getSession } from '@/src/shared/lib/auth/auth';
import { getUserByWallet } from '@/src/features/users/queries';
import { reviewerNavItems } from '@/src/features/reviewer/nav';
import { buildUserProfile } from '@/src/features/users/mappers';
import { ROLE_DASHBOARD_ROUTES } from '@/src/shared/lib/routes';

export default async function ReviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = (await getSession())!;
  const user = await getUserByWallet(wallet);

  // Validate user has reviewer role
  if (!user?.roles?.includes('reviewer')) {
    // Redirect to first available role or login
    const fallbackRole = user?.roles?.[0];
    if (fallbackRole && fallbackRole in ROLE_DASHBOARD_ROUTES) {
      redirect(ROLE_DASHBOARD_ROUTES[fallbackRole]);
    }
    redirect('/login');
  }

  const profile = buildUserProfile(wallet, user, 'reviewer');

  return (
    <RoleShell navItems={reviewerNavItems} user={profile}>
      {children}
    </RoleShell>
  );
}
