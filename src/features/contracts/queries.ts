import { cache } from 'react';
import { db } from '@/src/shared/lib/db';
import {
  authorshipContracts,
  contractContributors,
} from '@/src/shared/lib/db/schema';
import { and, eq, gt, inArray } from 'drizzle-orm';
import { getUserByWallet } from '@/src/features/users/queries';

export const listUserContracts = cache(async (walletAddress: string) => {
  const user = await getUserByWallet(walletAddress);

  if (!user) return [];

  return db.query.authorshipContracts.findMany({
    where: eq(authorshipContracts.creatorId, user.id),
    with: { contributors: true },
    orderBy: (c, { desc }) => [desc(c.updatedAt)],
  });
});

/** Validates token hasn't expired, then returns contributor + full contract. */
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

/** Contracts where this wallet has a pending (unsigned) contributor row. */
export const listContractsToSign = cache(async (walletAddress: string) => {
  const pendingIds = db
    .selectDistinct({ id: contractContributors.contractId })
    .from(contractContributors)
    .where(
      and(
        eq(contractContributors.contributorWallet, walletAddress.toLowerCase()),
        eq(contractContributors.status, 'pending'),
      ),
    );

  return db.query.authorshipContracts.findMany({
    where: inArray(authorshipContracts.id, pendingIds),
    with: { contributors: true, creator: true },
  });
});

/** Throws if wallet is not the contract creator. */
export async function requireContractOwner(contractId: string, wallet: string) {
  const contract = await getContractById(contractId);
  if (!contract) throw new Error('Contract not found');

  const user = await getUserByWallet(wallet);
  if (!user || contract.creatorId !== user.id) {
    throw new Error('Only the contract creator can perform this action');
  }

  return contract;
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
