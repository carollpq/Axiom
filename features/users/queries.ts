import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export function getUserByWallet(walletAddress: string) {
  return (
    db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .limit(1)
      .get() ?? null
  );
}

export function getOrCreateUser(walletAddress: string) {
  const normalized = walletAddress.toLowerCase();
  const existing = getUserByWallet(normalized);
  if (existing) return existing;

  return db
    .insert(users)
    .values({
      walletAddress: normalized,
      roles: ["author"],
    })
    .returning()
    .get();
}
