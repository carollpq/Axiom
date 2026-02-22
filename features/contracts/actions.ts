import { db } from "@/lib/db";
import { authorshipContracts, contractContributors, users } from "@/lib/db/schema";
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
