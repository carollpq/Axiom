import type { ExplorerPaper } from "@/src/features/researcher/types/explorer";
import type { ApiPaper } from "@/src/shared/types/api";
import { toPublicDisplayStatus } from "@/src/shared/lib/status-map";

export function mapApiPaperToExplorer(p: ApiPaper): ExplorerPaper {
  const latestVersion = p.versions?.[0] ?? null;
  const contract = p.contracts?.[0] ?? null;

  const authors =
    contract?.contributors?.length
      ? contract.contributors.map((c) => ({
          name: c.contributorName ?? c.contributorWallet.slice(0, 8) + "\u2026",
          pct: c.contributionPct,
          orcid: "\u2014",
          role: c.roleDescription ?? "",
        }))
      : p.owner
      ? [
          {
            name: p.owner.displayName ?? p.owner.walletAddress.slice(0, 8) + "\u2026",
            pct: 100,
            orcid: p.owner.orcidId ?? "\u2014",
            role: "Researcher",
          },
        ]
      : [];

  return {
    id: p.id,
    title: p.title,
    authors,
    status: toPublicDisplayStatus(p.status),
    studyType: p.studyType ?? "original",
    journal: "\u2014",
    field: p.owner?.researchFields?.[0] ?? "Unknown",
    date: p.updatedAt.slice(0, 10),
    abstract: p.abstract ?? "",
    paperHash: latestVersion?.paperHash ?? "",
    datasetHash: latestVersion?.datasetHash ?? "",
    codeCommit: latestVersion?.codeCommitHash ?? "",
    envHash: latestVersion?.envSpecHash ?? "",
    contractHash: contract?.contractHash ?? "",
    txHash: latestVersion?.hederaTxId ?? "",
    regTimestamp: latestVersion?.hederaTimestamp
      ? latestVersion.hederaTimestamp.replace("T", " ").slice(0, 19) + " UTC"
      : latestVersion?.createdAt
      ? latestVersion.createdAt.replace("T", " ").slice(0, 19) + " UTC"
      : "",
    codeUrl: latestVersion?.codeRepoUrl ?? "",
    datasetUrl: "",
    visibility: p.visibility,
    litDataToEncryptHash: p.litDataToEncryptHash ?? null,
    litAccessConditionsJson: p.litAccessConditionsJson ?? null,
    fileStorageKey: latestVersion?.fileStorageKey ?? null,
    versions: (p.versions ?? []).map((v, i) => ({
      v: `v${v.versionNumber}`,
      date: v.createdAt.slice(0, 10),
      label: i === (p.versions?.length ?? 0) - 1 ? toPublicDisplayStatus(p.status) : "Previous",
      hash:
        v.paperHash.length > 12
          ? `${v.paperHash.slice(0, 6)}\u2026${v.paperHash.slice(-4)}`
          : v.paperHash,
    })),
    reviews: [],
    decision:
      p.status === "published"
        ? "Accepted"
        : p.status === "retracted"
        ? "Retracted"
        : null,
    retracted: p.status === "retracted",
  };
}
