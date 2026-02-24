import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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

export async function getOrCreateUser(walletAddress: string) {
  const normalized = walletAddress.toLowerCase();
  const existing = await getUserByWallet(normalized);
  if (existing) return existing;

  return (
    await db
      .insert(users)
      .values({
        walletAddress: normalized,
        roles: ["author"],
      })
      .returning()
  )[0];
}
