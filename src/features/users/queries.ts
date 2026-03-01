import { db } from "@/src/shared/lib/db";
import { users } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserByWallet(walletAddress: string) {
  return (
    (
      await db
        .select()
        .from(users)
        .where(eq(users.walletAddress, walletAddress.toLowerCase()))
        .limit(1)
    )[0] ?? null
  );
}

export async function getUserRoles(walletAddress: string): Promise<string[]> {
  const result = await db
    .select({ roles: users.roles })
    .from(users)
    .where(eq(users.walletAddress, walletAddress.toLowerCase()))
    .limit(1);
  return result[0]?.roles ?? [];
}

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
