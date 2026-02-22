import { db } from "@/lib/db";
import { authorshipContracts, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export function listUserContracts(walletAddress: string) {
  const user = db
    .select()
    .from(users)
    .where(eq(users.walletAddress, walletAddress.toLowerCase()))
    .limit(1)
    .get();

  if (!user) return [];

  return db.query.authorshipContracts.findMany({
    where: eq(authorshipContracts.creatorId, user.id),
    with: { contributors: true },
    orderBy: (c, { desc }) => [desc(c.updatedAt)],
  });
}

export function getContractById(id: string) {
  return (
    db.query.authorshipContracts.findFirst({
      where: eq(authorshipContracts.id, id),
      with: {
        contributors: true,
        creator: true,
        paper: true,
      },
    }) ?? null
  );
}
