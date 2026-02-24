import { db } from "@/src/shared/lib/db";
import { authorshipContracts, users } from "@/src/shared/lib/db/schema";
import { eq } from "drizzle-orm";

export async function listUserContracts(walletAddress: string) {
  const user = (
    await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .limit(1)
  )[0];

  if (!user) return [];

  return db.query.authorshipContracts.findMany({
    where: eq(authorshipContracts.creatorId, user.id),
    with: { contributors: true },
    orderBy: (c, { desc }) => [desc(c.updatedAt)],
  });
}

export async function getContractById(id: string) {
  return (
    (await db.query.authorshipContracts.findFirst({
      where: eq(authorshipContracts.id, id),
      with: {
        contributors: true,
        creator: true,
        paper: true,
      },
    })) ?? null
  );
}
