import type { PaperRow, PaperStatus, StatCardData } from "@/src/features/researcher/types/dashboard";
import type { DbPaperWithRelations } from "@/src/features/papers/queries";
import { toDisplayStatus } from "@/src/shared/lib/status-map";
import { truncateHash, formatIsoDate } from "@/src/shared/lib/format";
import { ScrollText, PenLine, Clock, Sparkles } from "lucide-react";

/**
 * Derives the best display status by combining paper status with
 * the latest submission status (if any). Submission-level statuses
 * like "viewed_by_editor" and "reviews_completed" are more granular
 * than the paper-level "submitted" status.
 */
function derivePaperDisplayStatus(p: DbPaperWithRelations): PaperStatus {
  // If a submission exists, prefer its status for more granular display
  const latestSub = p.submissions?.at(-1);
  if (latestSub) {
    const subDisplay = toDisplayStatus(latestSub.status);
    // Only use submission status if it's more specific than the paper status
    if (subDisplay !== "Draft") return subDisplay;
  }
  return toDisplayStatus(p.status);
}

/**
 * Converts a Drizzle paper row (with relations) into a flat PaperRow for the
 * dashboard table. Derives three display-only fields:
 *   - coauthors: flattens contracts → contributors → names into a comma-separated string
 *   - hash: picks the first version's paperHash and truncates it for display
 *   - status: converts the DB enum (e.g. "contract_pending") to a display label
 */
export function mapDbPaperToFrontend(p: DbPaperWithRelations): PaperRow {
  const coauthors =
    p.contracts
      ?.flatMap((c) => c.contributors ?? [])
      .map((c) => c.contributorName)
      .filter(Boolean)
      .join(", ") || "\u2014";

  return {
    id: p.id,
    title: p.title,
    status: derivePaperDisplayStatus(p),
    coauthors,
    date: formatIsoDate(p.createdAt),
    hash: truncateHash(p.versions?.[0]?.paperHash ?? "\u2014"),
  };
}

export function computeStats(papers: PaperRow[]): StatCardData[] {
  const total = papers.length;
  const pending = papers.filter((p) => p.status === "Contract Pending").length;
  const review = papers.filter((p) => p.status === "Under Review").length;
  const published = papers.filter((p) => p.status === "Published").length;

  return [
    { label: "Total Papers", value: String(total), icon: ScrollText },
    { label: "Pending Contracts", value: String(pending), icon: PenLine },
    { label: "Under Review", value: String(review), icon: Clock },
    { label: "Published", value: String(published), icon: Sparkles },
  ];
}
