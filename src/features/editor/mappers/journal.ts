import type { JournalSubmission, SubmissionStage, PoolReviewer, PaperCardData, ReviewerWithStatus } from "@/src/features/editor/types";
import type { DbJournalSubmission, DbReviewer, DbReputationScore } from "../queries";
import { formatIsoDate, truncateHash, displayNameOrWallet, toFivePointScale } from "@/src/shared/lib/format";

function deriveStage(
  status: string,
  criteriaHash: string | null,
  reviewerWallets: string[],
  criteriaMet: boolean | null,
  decision: string | null,
): SubmissionStage {
  if (status === "published") return "Published";
  if (status === "rejected") return "Rejected";
  if (status === "under_review") {
    if (criteriaMet !== null || decision !== null) return "Decision Pending";
    return "Under Review";
  }
  // "submitted" / "revision_requested"
  if (reviewerWallets.length > 0) return "Reviewers Assigned";
  if (criteriaHash) return "Criteria Published";
  return "New";
}

export function mapDbToJournalSubmission(s: DbJournalSubmission, index: number): JournalSubmission {
  const latestVersion = s.paper.versions?.at(-1);
  const hash = latestVersion ? truncateHash(latestVersion.paperHash, 8) : "—";
  const wallets = (s.reviewerWallets as string[] | null) ?? [];

  return {
    id: index + 1,
    title: s.paper.title,
    authors: s.paper.owner?.displayName ?? "Unknown",
    submitted: formatIsoDate(s.submittedAt),
    stage: deriveStage(s.status, s.criteriaHash ?? null, wallets, s.criteriaMet ?? null, s.decision ?? null),
    reviewers: wallets,
    deadline: s.reviewDeadline ?? null,
    criteriaPublished: !!s.criteriaHash,
    criteriaMet: s.criteriaMet ?? null,
    hash,
  };
}

export function mapDbToPoolReviewer(u: DbReviewer, scoreRow?: DbReputationScore | null): PoolReviewer {
  const fields = (u.researchFields as string[] | null) ?? [];
  return {
    id: String(u.id),
    name: String(u.displayName ?? u.walletAddress),
    field: fields[0] ?? "—",
    score: scoreRow ? toFivePointScale(scoreRow.overallScore) : 0,
    orcid: String(u.orcidId ?? "—"),
    reviews: scoreRow?.reviewCount ?? 0,
  };
}

export function mapDbToPaperCardData(s: DbJournalSubmission): PaperCardData {
  const abstract = s.paper.abstract ?? "";
  const submittedDate = s.submittedAt ? formatIsoDate(String(s.submittedAt)) : "—";
  return {
    id: s.id,
    title: s.paper.title,
    authors: s.paper.owner?.displayName ?? s.paper.owner?.walletAddress ?? "Unknown",
    abstractSnippet: abstract.length > 180 ? abstract.slice(0, 177) + "…" : abstract,
    submittedDate,
  };
}

export function mapDbToReviewerWithStatus(
  assignment: { id: string; reviewerWallet: string; status: string },
  nameByWallet?: Record<string, string>,
): ReviewerWithStatus {
  const statusMap: Record<string, ReviewerWithStatus["status"]> = {
    assigned: "pending",
    accepted: "in_progress",
    submitted: "complete",
    declined: "rejected",
    late: "in_progress",
  };
  const name =
    nameByWallet?.[assignment.reviewerWallet] ??
    displayNameOrWallet(null, assignment.reviewerWallet);
  return {
    id: assignment.id,
    name,
    status: statusMap[assignment.status] ?? "pending",
    hasComment: assignment.status === "submitted",
  };
}
