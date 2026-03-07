import type { SignedContract } from "@/src/features/researcher/types/paper-registration";
import type { Contributor, ExistingDraft } from "@/src/features/researcher/types/contract";
import type { ApiContract, ApiContractContributor, ApiPaper } from "@/src/shared/types/api";
import { formatIsoDate } from "@/src/shared/lib/format";

export function mapApiContributors(dbContribs: ApiContractContributor[]): Contributor[] {
  return dbContribs.map((c, i) => ({
    id: i + 1,
    dbId: c.id,
    wallet: c.contributorWallet,
    did: c.contributorWallet,
    name: c.contributorName ?? "Unknown user",
    orcid: "\u2014",
    pct: c.contributionPct,
    role: c.roleDescription ?? "",
    status: c.status as Contributor["status"],
    txHash: c.signature ?? null,
    signedAt: c.signedAt ?? null,
    isCreator: c.isCreator,
  }));
}

export function mapApiPapersToDrafts(
  papers: ApiPaper[],
  contracts: ApiContract[],
): ExistingDraft[] {
  return papers
    .filter((p) => p.status === "draft" || p.status === "registered" || p.status === "contract_pending")
    .map((p, i) => {
      const match = contracts.find((c) =>
        c.paperId ? c.paperId === p.id : c.paperTitle === p.title,
      );
      return {
        id: i + 1,
        dbId: p.id,
        title: p.title,
        hash: p.versions?.[0]?.paperHash ?? "\u2014",
        registered: p.status === "registered" || p.status === "contract_pending",
        contractId: match?.id,
        contributors: match?.contributors.length
          ? mapApiContributors(match.contributors)
          : undefined,
      };
    });
}

function mapContributorSummary(cc: ApiContractContributor) {
  return {
    name: cc.contributorName ?? "Unknown",
    role: cc.roleDescription ?? "",
    pct: cc.contributionPct,
    status: cc.status,
  };
}

export function mapContractsToSign(
  contracts: Awaited<ReturnType<typeof import("@/src/features/contracts/queries").listContractsToSign>>,
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

export function mapOwnedContractsForStatus(contracts: ApiContract[]) {
  return contracts.map((c) => {
    const pendingCount = c.contributors.filter(
      (cc) => cc.status === "pending",
    ).length;
    return {
      id: c.id,
      paperTitle: c.paperTitle,
      allSigned: c.status === "fully_signed",
      pendingCount,
      contributors: c.contributors.map(mapContributorSummary),
    };
  });
}

export function mapDbContractToSigned(c: ApiContract): SignedContract {
  const contribSummary = c.contributors
    .map((cc) => `${cc.contributorName ?? "Unknown"} (${cc.contributionPct}%)`)
    .join(", ");

  return {
    id: c.id,
    title: c.paperTitle,
    hash: c.contractHash ?? "\u2014",
    contributors: contribSummary || "\u2014",
    date: formatIsoDate(c.createdAt),
  };
}
