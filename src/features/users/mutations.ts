import { sql } from 'drizzle-orm';
import { db } from '@/src/shared/lib/db';
import { users } from '@/src/shared/lib/db/schema';
import type { Role } from '@/src/features/auth/types';
import { getUserByWallet } from '@/src/features/users/queries';

/** Upserts user with role, ORCID, and display name. Appends role if new. */
export async function registerUserRole(
  walletAddress: string,
  role: Role,
  orcidId: string,
  displayName: string,
) {
  const walletLower = walletAddress.toLowerCase();
  const existing = await getUserByWallet(walletLower);

  const updatedRoles = existing
    ? existing.roles.includes(role)
      ? existing.roles
      : [...existing.roles, role]
    : [role];

  await db
    .insert(users)
    .values({
      walletAddress: walletLower,
      roles: updatedRoles,
      orcidId,
      displayName,
    })
    .onConflictDoUpdate({
      target: users.walletAddress,
      set: {
        roles: updatedRoles,
        orcidId,
        displayName,
        updatedAt: sql`now()`,
      },
    });
}
