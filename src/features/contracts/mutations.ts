import { db } from '@/src/shared/lib/db';
import {
  authorshipContracts,
  contractContributors,
  type ContractStatusDb,
  type ContributorStatusDb,
} from '@/src/shared/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getUserByWallet } from '@/src/features/users/queries';

export interface CreateContractInput {
  paperTitle: string;
  paperId?: string | null;
  wallet: string;
}

export async function createContract(input: CreateContractInput) {
  const user = await getUserByWallet(input.wallet);

  if (!user) return null;

  return (
    await db
      .insert(authorshipContracts)
      .values({
        paperTitle: input.paperTitle,
        paperId: input.paperId ?? null,
        creatorId: user.id,
      })
      .returning()
  )[0];
}

export interface AddContributorInput {
  contractId: string;
  contributorWallet: string;
  contributorName?: string | null;
  contributionPct: number;
  roleDescription?: string | null;
  isCreator?: boolean;
}

export async function addContributor(input: AddContributorInput) {
  return (
    await db
      .insert(contractContributors)
      .values({
        contractId: input.contractId,
        contributorWallet: input.contributorWallet.toLowerCase(),
        contributorName: input.contributorName ?? null,
        contributionPct: input.contributionPct,
        roleDescription: input.roleDescription ?? null,
        isCreator: input.isCreator ?? false,
      })
      .returning()
  )[0];
}

export async function removeContributor(
  contractId: string,
  contributorId: string,
) {
  return (
    (
      await db
        .delete(contractContributors)
        .where(
          and(
            eq(contractContributors.id, contributorId),
            eq(contractContributors.contractId, contractId),
          ),
        )
        .returning()
    )[0] ?? null
  );
}

export async function updateContractHedera(
  contractId: string,
  hederaTxId: string,
  hederaTimestamp: string,
) {
  return (
    (
      await db
        .update(authorshipContracts)
        .set({
          hederaTxId,
          hederaTimestamp,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(authorshipContracts.id, contractId))
        .returning()
    )[0] ?? null
  );
}

export async function generateInviteToken(
  contractId: string,
  contributorId: string,
) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const updated = (
    await db
      .update(contractContributors)
      .set({ inviteToken: token, inviteExpiresAt: expiresAt })
      .where(
        and(
          eq(contractContributors.id, contributorId),
          eq(contractContributors.contractId, contractId),
        ),
      )
      .returning()
  )[0];

  if (!updated) return null;
  return { token, expiresAt };
}

export async function resetContractSignatures(contractId: string) {
  const now = new Date().toISOString();

  await db
    .update(contractContributors)
    .set({
      status: 'pending' as ContributorStatusDb,
      signature: null,
      signedAt: null,
    })
    .where(eq(contractContributors.contractId, contractId));

  return (
    (
      await db
        .update(authorshipContracts)
        .set({
          status: 'pending_signatures' as ContractStatusDb,
          contractHash: null,
          updatedAt: now,
        })
        .where(eq(authorshipContracts.id, contractId))
        .returning()
    )[0] ?? null
  );
}

export interface SignContributorInput {
  contractId: string;
  contributorWallet: string;
  signature: string;
  contractHash?: string;
}

export async function updateContractSchedule(
  contractId: string,
  scheduleId: string,
  scheduleTxId: string,
) {
  return (
    (
      await db
        .update(authorshipContracts)
        .set({
          hederaScheduleId: scheduleId,
          hederaScheduleTxId: scheduleTxId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(authorshipContracts.id, contractId))
        .returning()
    )[0] ?? null
  );
}

export async function updateContributorScheduleSign(
  contributorId: string,
  scheduleTxId: string,
) {
  return (
    (
      await db
        .update(contractContributors)
        .set({ hederaScheduleSignTxId: scheduleTxId })
        .where(eq(contractContributors.id, contributorId))
        .returning()
    )[0] ?? null
  );
}

export async function signContributor(input: SignContributorInput) {
  const now = new Date().toISOString();

  const updated = (
    await db
      .update(contractContributors)
      .set({
        signature: input.signature,
        status: 'signed' as ContributorStatusDb,
        signedAt: now,
      })
      .where(
        and(
          eq(contractContributors.contractId, input.contractId),
          eq(
            contractContributors.contributorWallet,
            input.contributorWallet.toLowerCase(),
          ),
        ),
      )
      .returning()
  )[0];

  if (!updated) return null;

  // Check if all contributors are now signed — auto-advance contract status
  const allContribs = await db
    .select()
    .from(contractContributors)
    .where(eq(contractContributors.contractId, input.contractId));

  const allSigned = allContribs.every((c) => c.status === 'signed');

  await db
    .update(authorshipContracts)
    .set({
      status: (allSigned
        ? 'fully_signed'
        : 'pending_signatures') as ContractStatusDb,
      contractHash: allSigned ? (input.contractHash ?? null) : undefined,
      updatedAt: now,
    })
    .where(eq(authorshipContracts.id, input.contractId));

  return updated;
}
