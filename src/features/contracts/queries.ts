import { db } from "@/src/shared/lib/db";
import { authorshipContracts, contractContributors, users } from "@/src/shared/lib/db/schema";
import { and, eq, gt, inArray } from "drizzle-orm";

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

export async function getContributorByInviteToken(token: string) {
  const now = new Date().toISOString();

  const contributor = (
    await db
      .select()
      .from(contractContributors)
      .where(
        and(
          eq(contractContributors.inviteToken, token),
          gt(contractContributors.inviteExpiresAt, now),
        ),
      )
      .limit(1)
  )[0];

  if (!contributor) return null;

  const contract = await db.query.authorshipContracts.findFirst({
    where: eq(authorshipContracts.id, contributor.contractId),
    with: { contributors: true },
  });

  if (!contract) return null;

  return { contributor, contract };
}

export async function listContractsToSign(walletAddress: string) {
  const pendingIds = db
    .selectDistinct({ id: contractContributors.contractId })
    .from(contractContributors)
    .where(
      and(
        eq(contractContributors.contributorWallet, walletAddress.toLowerCase()),
        eq(contractContributors.status, "pending"),
      ),
    );

  return db.query.authorshipContracts.findMany({
    where: inArray(authorshipContracts.id, pendingIds),
    with: { contributors: true, creator: true },
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
