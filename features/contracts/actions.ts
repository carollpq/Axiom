import { db } from "@/lib/db";
import {
  authorshipContracts,
  contractContributors,
  users,
  type ContractStatusDb,
  type ContributorStatusDb,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export interface CreateContractInput {
  paperTitle: string;
  paperId?: string | null;
  wallet: string;
}

export function createContract(input: CreateContractInput) {
  const user = db
    .select()
    .from(users)
    .where(eq(users.walletAddress, input.wallet.toLowerCase()))
    .limit(1)
    .get();

  if (!user) return null;

  return db
    .insert(authorshipContracts)
    .values({
      paperTitle: input.paperTitle,
      paperId: input.paperId ?? null,
      creatorId: user.id,
    })
    .returning()
    .get();
}

export interface AddContributorInput {
  contractId: string;
  contributorWallet: string;
  contributorName?: string | null;
  contributionPct: number;
  roleDescription?: string | null;
  isCreator?: boolean;
}

export function addContributor(input: AddContributorInput) {
  return db
    .insert(contractContributors)
    .values({
      contractId: input.contractId,
      contributorWallet: input.contributorWallet,
      contributorName: input.contributorName ?? null,
      contributionPct: input.contributionPct,
      roleDescription: input.roleDescription ?? null,
      isCreator: input.isCreator ?? false,
    })
    .returning()
    .get();
}

export function removeContributor(contractId: string, contributorId: string) {
  return (
    db
      .delete(contractContributors)
      .where(
        and(
          eq(contractContributors.id, contributorId),
          eq(contractContributors.contractId, contractId),
        ),
      )
      .returning()
      .get() ?? null
  );
}

export function updateContractHedera(
  contractId: string,
  hederaTxId: string,
  hederaTimestamp: string,
) {
  return (
    db
      .update(authorshipContracts)
      .set({ hederaTxId, hederaTimestamp, updatedAt: new Date().toISOString() })
      .where(eq(authorshipContracts.id, contractId))
      .returning()
      .get() ?? null
  );
}

export interface SignContributorInput {
  contractId: string;
  contributorWallet: string;
  signature: string;
  contractHash?: string;
}

export function signContributor(input: SignContributorInput) {
  const now = new Date().toISOString();

  const updated = db
    .update(contractContributors)
    .set({
      signature: input.signature,
      status: "signed" as ContributorStatusDb,
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
    .get();

  if (!updated) return null;

  // Check if all contributors are now signed — auto-advance contract status
  const allContribs = db
    .select()
    .from(contractContributors)
    .where(eq(contractContributors.contractId, input.contractId))
    .all();

  const allSigned = allContribs.every((c) => c.status === "signed");

  db.update(authorshipContracts)
    .set({
      status: (allSigned
        ? "fully_signed"
        : "pending_signatures") as ContractStatusDb,
      contractHash: allSigned ? (input.contractHash ?? null) : undefined,
      updatedAt: now,
    })
    .where(eq(authorshipContracts.id, input.contractId))
    .run();

  return updated;
}
