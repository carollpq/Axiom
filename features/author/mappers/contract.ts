import type { SignedContract } from "@/features/author/types/paper-registration";
import type { ApiContract } from "@/types/api";

export function mapDbContractToSigned(c: ApiContract, index: number): SignedContract {
  const contribSummary = c.contributors
    .map((cc) => `${cc.contributorName ?? "Unknown"} (${cc.contributionPct}%)`)
    .join(", ");

  return {
    id: index + 1,
    title: c.paperTitle,
    hash: c.contractHash ?? "\u2014",
    contributors: contribSummary || "\u2014",
    date: c.createdAt.slice(0, 10),
  };
}
