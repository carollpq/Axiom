import { getSession } from "@/src/shared/lib/auth/auth";
import { listUserPapers } from "@/src/features/papers/queries";
import { listUserContracts, listContractsToSign } from "@/src/features/contracts/queries";
import { mapApiPapersToDrafts, mapContractsToSign, mapOwnedContractsForStatus } from "@/src/features/researcher/mappers/contract";
import { AuthorshipContractsTabs } from "@/src/features/researcher/components/authorship-contracts/AuthorshipContractsTabs.client";
import type { ApiPaper, ApiContract } from "@/src/shared/types/api";

export default async function AuthorshipContractsPage() {
  const wallet = (await getSession())!;
  const walletLower = wallet.toLowerCase();

  const [papers, ownedContracts, contractsToSignData] = await Promise.all([
    listUserPapers(wallet) as Promise<ApiPaper[]>,
    listUserContracts(wallet) as Promise<ApiContract[]>,
    listContractsToSign(wallet),
  ]);

  return (
    <AuthorshipContractsTabs
      initialDrafts={mapApiPapersToDrafts(papers, ownedContracts)}
      contractsToSign={mapContractsToSign(contractsToSignData, walletLower)}
      ownedContracts={mapOwnedContractsForStatus(ownedContracts)}
      currentWallet={walletLower}
    />
  );
}
