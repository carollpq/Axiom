import { getSession } from "@/src/shared/lib/auth/auth";
import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts } from "@/src/features/contracts/queries";
import { mapApiPapersToDrafts } from "@/src/features/researcher/mappers/contract";
import { AuthorshipContractsTabs } from "@/src/features/researcher/components/authorship-contracts/AuthorshipContractsTabs.client";
import { db } from "@/src/shared/lib/db";
import { contractContributors, authorshipContracts } from "@/src/shared/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { ApiPaper, ApiContract } from "@/src/shared/types/api";

export default async function AuthorshipContractsPage() {
  const wallet = (await getSession())!;
  const walletLower = wallet.toLowerCase();

  const [papers, ownedContracts] = await Promise.all([
    listUserPapers(wallet) as Promise<ApiPaper[]>,
    listUserContracts(wallet) as Promise<ApiContract[]>,
  ]);

  // Build New Contract: drafts for the existing contract builder
  const initialDrafts = mapApiPapersToDrafts(papers, ownedContracts);

  // Contracts to Sign: contracts where user is a contributor but NOT creator, and hasn't signed
  const pendingContribRows = await db
    .select({
      contractId: contractContributors.contractId,
    })
    .from(contractContributors)
    .where(
      and(
        eq(contractContributors.contributorWallet, walletLower),
        eq(contractContributors.status, "pending"),
      ),
    );

  const pendingContractIds = pendingContribRows.map((r) => r.contractId);

  // Fetch full contract data for contracts to sign (single batch query)
  const contractsToSignData = pendingContractIds.length > 0
    ? await db.query.authorshipContracts.findMany({
        where: inArray(authorshipContracts.id, pendingContractIds),
        with: { contributors: true, creator: true },
      })
    : [];

  const contractsToSign = contractsToSignData
    .filter((c) => c.creator?.walletAddress?.toLowerCase() !== walletLower)
    .map((c) => ({
      id: c.id,
      paperTitle: c.paperTitle,
      contributors: c.contributors.map((cc) => ({
        name: cc.contributorName ?? "Unknown",
        role: cc.roleDescription ?? "",
        pct: cc.contributionPct,
        status: cc.status,
        wallet: cc.contributorWallet,
      })),
    }));

  // Your Contracts Status: contracts the user created
  const ownedContractsForStatus = ownedContracts.map((c) => {
    const pendingCount = c.contributors.filter(
      (cc) => cc.status === "pending",
    ).length;
    return {
      id: c.id,
      paperTitle: c.paperTitle,
      allSigned: c.status === "fully_signed",
      pendingCount,
      contributors: c.contributors.map((cc) => ({
        name: cc.contributorName ?? "Unknown",
        role: cc.roleDescription ?? "",
        pct: cc.contributionPct,
        status: cc.status,
      })),
    };
  });

  return (
    <AuthorshipContractsTabs
      initialDrafts={initialDrafts}
      contractsToSign={contractsToSign}
      ownedContracts={ownedContractsForStatus}
      currentWallet={walletLower}
    />
  );
}
