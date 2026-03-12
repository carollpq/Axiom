'use server';

import { requireSession } from '@/src/shared/lib/auth/auth';
import { searchUsers } from '@/src/features/users/queries';

/** Authenticated wrapper around searchUsers. Requires min 2 chars. */
export async function searchUsersAction(query: string) {
  await requireSession();

  const q = query?.trim();
  if (!q || q.length < 2) return [];

  return searchUsers(q);
}
