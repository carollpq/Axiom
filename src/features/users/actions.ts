import { eq } from "drizzle-orm";
import { db } from "@/src/shared/lib/db";
import { users } from "@/src/shared/lib/db/schema";
import type { Role } from "@/src/features/auth/types";

export async function registerUserRole(
  walletAddress: string,
  role: Role,
  orcidId: string
) {
  const walletLower = walletAddress.toLowerCase();

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletLower))
    .limit(1);

  if (existing.length > 0) {
    const currentRoles = (existing[0].roles as string[]) || [];
    const updatedRoles = currentRoles.includes(role)
      ? currentRoles
      : [...currentRoles, role];

    await db
      .update(users)
      .set({
        roles: updatedRoles,
        orcidId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.walletAddress, walletLower));
  } else {
    await db.insert(users).values({
      walletAddress: walletLower,
      roles: [role],
      orcidId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}
