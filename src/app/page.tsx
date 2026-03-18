import { redirect } from 'next/navigation';
import { getSession } from '@/src/shared/lib/auth/auth';
import { getUserByWallet } from '@/src/features/users/queries';
import { ROUTES, ROLE_DASHBOARD_ROUTES } from '@/src/shared/lib/routes';
import { LandingPage } from '@/src/features/landing/components/LandingPage';

export default async function RootPage() {
  const wallet = await getSession();

  if (!wallet) {
    return <LandingPage />;
  }

  const user = await getUserByWallet(wallet);

  if (!user?.roles?.length) {
    redirect(ROUTES.register);
  }

  redirect(ROLE_DASHBOARD_ROUTES[user.roles[0]] ?? ROUTES.researcher.root);
}
