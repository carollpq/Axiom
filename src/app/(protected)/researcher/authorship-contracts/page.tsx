import { getSession } from '@/src/shared/lib/auth/auth';
import { listUserPapers } from '@/src/features/papers/queries';
import {
  listUserContracts,
  listContractsToSign,
} from '@/src/features/contracts/queries';
import {
  mapApiPapersToDrafts,
  mapContractsToSign,
  mapOwnedContractsForStatus,
} from '@/src/features/researcher/lib/contract';
import { AuthorshipContractsTabs } from '@/src/features/researcher/components/authorship-contracts/authorship-contracts-tabs.client';
import type { Paper, Contract } from '@/src/shared/types/domain';

export default async function AuthorshipContractsPage() {
  const wallet = (await getSession())!;
  const walletLower = wallet.toLowerCase();

  const [papers, ownedContracts, contractsToSignData] = await Promise.all([
    listUserPapers(wallet) as Promise<Paper[]>,
    listUserContracts(wallet) as Promise<Contract[]>,
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
