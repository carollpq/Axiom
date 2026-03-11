import { cache } from 'react';
import { db } from '@/src/shared/lib/db';
import { users } from '@/src/shared/lib/db/schema';
import { eq, or, ilike } from 'drizzle-orm';
import type { UserSearchResult } from '@/src/shared/types/domain';

/** React `cache()`-wrapped — safe to call multiple times per request. */
export const getUserByWallet = cache(async (walletAddress: string) => {
  return (
    (
      await db
        .select()
        .from(users)
        .where(eq(users.walletAddress, walletAddress.toLowerCase()))
        .limit(1)
    )[0] ?? null
  );
});

/** Returns existing user or inserts a skeleton row (no role yet). */
export async function getOrCreateUser(walletAddress: string) {
  const normalized = walletAddress.toLowerCase();
  const existing = await getUserByWallet(normalized);
  if (existing) return existing;

  return (
    await db
      .insert(users)
      .values({
        walletAddress: normalized,
        roles: [], // Empty until user selects role during signup
      })
      .returning()
  )[0];
}

/** Case-insensitive search across displayName, orcidId, and wallet. Max 10. */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const escaped = query.replace(/[%_]/g, '\\$&');
  const pattern = `%${escaped}%`;
  return db
    .select({
      id: users.id,
      walletAddress: users.walletAddress,
      displayName: users.displayName,
      orcidId: users.orcidId,
    })
    .from(users)
    .where(
      or(
        ilike(users.displayName, pattern),
        ilike(users.orcidId, pattern),
        ilike(users.walletAddress, pattern),
      ),
    )
    .limit(10);
}
