import type { SignedContract } from '@/src/features/researcher/types/paper-registration';
import type {
  Contributor,
  ExistingDraft,
} from '@/src/features/researcher/types/contract';
import type {
  Contract,
  ContractContributor,
  Paper,
} from '@/src/shared/types/domain';
import { formatDate } from '@/src/shared/lib/format';

/** Maps DB contributors to the client-side Contributor shape. */
export function mapApiContributors(
  dbContribs: ContractContributor[],
): Contributor[] {
  return dbContribs.map((c, i) => ({
    id: i + 1,
    dbId: c.id,
    wallet: c.contributorWallet,
    did: c.contributorWallet,
    name: c.contributorName ?? 'Unknown user',
    orcid: '\u2014',
    pct: c.contributionPct,
    role: c.roleDescription ?? '',
    status: c.status as Contributor['status'],
    txHash: c.signature ?? null,
    signedAt: c.signedAt ?? null,
    isCreator: c.isCreator,
  }));
}

/** Filters to draft/registered/contract_pending papers and pairs each with its contract. */
export function mapApiPapersToDrafts(
  papers: Paper[],
  contracts: Contract[],
): ExistingDraft[] {
  return papers
    .filter(
      (p) =>
        p.status === 'draft' ||
        p.status === 'registered' ||
        p.status === 'contract_pending',
    )
    .map((p, i) => {
      // Prefer matching by paperId (unique). Fall back to title only when
      // paperId is null AND no other paper in the batch shares the same title,
      // to avoid ambiguous matches.
      const match =
        contracts.find((c) => c.paperId && c.paperId === p.id) ??
        contracts.find(
          (c) =>
            !c.paperId &&
            c.paperTitle === p.title &&
            papers.filter((pp) => pp.title === p.title).length === 1,
        );
      return {
        id: i + 1,
        dbId: p.id,
        title: p.title,
        hash: p.versions?.[0]?.paperHash ?? '\u2014',
        registered:
          p.status === 'registered' || p.status === 'contract_pending',
        contractId: match?.id,
        hederaTxId: match?.hederaTxId ?? null,
        contributors: match?.contributors.length
          ? mapApiContributors(match.contributors)
          : undefined,
      };
    });
}

function mapContributorSummary(cc: ContractContributor) {
  return {
    name: cc.contributorName ?? 'Unknown',
    role: cc.roleDescription ?? '',
    pct: cc.contributionPct,
    status: cc.status,
  };
}

/** Contracts where the current user is a contributor (not the creator) and needs to sign. */
export function mapContractsToSign(
  contracts: Awaited<
    ReturnType<
      typeof import('@/src/features/contracts/queries').listContractsToSign
    >
  >,
  currentWallet: string,
) {
  return contracts
    .filter((c) => c.creator?.walletAddress?.toLowerCase() !== currentWallet)
    .map((c) => ({
      id: c.id,
      paperTitle: c.paperTitle,
      contributors: c.contributors.map((cc) => ({
        ...mapContributorSummary(cc),
        wallet: cc.contributorWallet,
      })),
    }));
}

/** Summarizes owned contracts with pending count and fully-signed status. */
export function mapOwnedContractsForStatus(contracts: Contract[]) {
  return contracts.map((c) => {
    const pendingCount = c.contributors.filter(
      (cc) => cc.status === 'pending',
    ).length;
    return {
      id: c.id,
      paperTitle: c.paperTitle,
      allSigned: c.status === 'fully_signed',
      hederaTxId: c.hederaTxId ?? null,
      pendingCount,
      contributors: c.contributors.map(mapContributorSummary),
    };
  });
}

/** Flattens contract + contributors into a single display row for the signed contracts table. */
export function mapDbContractToSigned(c: Contract): SignedContract {
  const contribSummary = c.contributors
    .map((cc) => `${cc.contributorName ?? 'Unknown'} (${cc.contributionPct}%)`)
    .join(', ');

  return {
    id: c.id,
    title: c.paperTitle,
    hash: c.contractHash ?? '\u2014',
    contributors: contribSummary || '\u2014',
    date: formatDate(c.createdAt),
  };
}
