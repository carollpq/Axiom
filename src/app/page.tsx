import { redirect } from 'next/navigation';
import { getSession } from '@/src/shared/lib/auth/auth';
import { getUserRoles } from '@/src/features/users/queries';
import { ROLE_DASHBOARD_ROUTES } from '@/src/shared/lib/routes';

export default async function RootPage() {
  const wallet = await getSession();

  if (!wallet) {
    redirect('/login');
  }

  const roles = await getUserRoles(wallet);

  if (roles.length === 0) {
    redirect('/register');
  }

  redirect(ROLE_DASHBOARD_ROUTES[roles[0]] ?? '/researcher');
}
