import { redirect } from 'next/navigation';
import { getSession } from '@/src/shared/lib/auth/auth';
import { getUserRoles } from '@/src/features/users/queries';

export default async function RootPage() {
  const wallet = await getSession();

  if (!wallet) {
    redirect('/login');
  }

  const roles = await getUserRoles(wallet);

  if (roles.length === 0) {
    redirect('/register');
  }

  const primaryRole = roles[0];

  if (primaryRole === 'reviewer') {
    redirect('/reviewer');
  }

  if (primaryRole === 'editor' || primaryRole === 'journal') {
    redirect('/editor');
  }

  // Default: researcher / author
  redirect('/researcher');
}
