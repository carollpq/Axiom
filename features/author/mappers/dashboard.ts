import type { Paper, StatCardData } from "@/features/author/types/dashboard";
import type { ApiPaper } from "@/types/api";
import { toDisplayStatus } from "@/lib/status-map";

export function mapDbPaperToFrontend(p: ApiPaper, index: number): Paper {
  const coauthors =
    p.contracts
      ?.flatMap((c) => c.contributors ?? [])
      .map((c) => c.contributorName)
      .filter(Boolean)
      .join(", ") || "\u2014";

  const hash = p.versions?.[0]?.paperHash ?? "\u2014";
  const truncatedHash =
    hash.length > 12
      ? `${hash.slice(0, 6)}...${hash.slice(-4)}`
      : hash;

  return {
    id: index + 1,
    title: p.title,
    status: toDisplayStatus(p.status),
    coauthors,
    date: p.createdAt.slice(0, 10),
    hash: truncatedHash,
  };
}

export function computeStats(papers: Paper[]): StatCardData[] {
  const total = papers.length;
  const pending = papers.filter((p) => p.status === "Contract Pending").length;
  const review = papers.filter((p) => p.status === "Under Review").length;
  const published = papers.filter((p) => p.status === "Published").length;

  return [
    { label: "Total Papers", value: String(total), icon: "\uD83D\uDCDC" },
    { label: "Pending Contracts", value: String(pending), icon: "\u270D" },
    { label: "Under Review", value: String(review), icon: "\u23F3" },
    { label: "Published", value: String(published), icon: "\u2726" },
  ];
}
